import json
import requests
from qgis.PyQt.QtWidgets import QAction, QMessageBox
from qgis.core import QgsProject, QgsFeature, QgsGeometry, QgsVectorLayer, QgsWkbTypes
from qgis.PyQt.QtCore import QVariant, QObject, pyqtSlot
from qgis.core import QgsProject, QgsField, QgsFields, QgsVectorLayer, QgsEditorWidgetSetup

class SavePolygonPlugin(QObject):
    def __init__(self, iface):
        super().__init__()
        self.iface = iface
        self.canvas = iface.mapCanvas()
        self.layer = None
        self.action = QAction("Save Polygon", iface.mainWindow())
        self.action.triggered.connect(self.run)

    def initGui(self):
        self.iface.addToolBarIcon(self.action)
        self.iface.addPluginToMenu("&Save Polygon Plugin", self.action)

    def unload(self):
        self.iface.removeToolBarIcon(self.action)
        self.iface.removePluginMenu("&Save Polygon Plugin", self.action)

    def ensure_layer_exists(self):
        layer_name = "Plots_Data"
        project = QgsProject.instance()
        layers = project.mapLayersByName(layer_name)

        if not layers:
            # Define fields
            fields = QgsFields()
            fields.append(QgsField("id", QVariant.Int))
            fields.append(QgsField("name", QVariant.String))
            fields.append(QgsField("area", QVariant.Double))
            fields.append(QgsField("type", QVariant.String))
            fields.append(QgsField("status", QVariant.String))
            fields.append(QgsField("disroad", QVariant.Double))
            fields.append(QgsField("diswater", QVariant.Double))
            fields.append(QgsField("elephase", QVariant.String))

            # Create the layer
            layer = QgsVectorLayer("Polygon?crs=EPSG:4326", layer_name, "memory")
            provider = layer.dataProvider()
            provider.addAttributes(fields)
            layer.updateFields()

            # Add layer to the project
            project.addMapLayer(layer)

            # Make 'id' field read-only
            idx = layer.fields().indexFromName('id')
            layer.setEditorWidgetSetup(idx, QgsEditorWidgetSetup('Hidden', {}))

            self.layer = layer
        else:
            self.layer = layers[0]

    def autofill_id_field(self, response_data):
        # Assuming response_data is a dictionary with 'id' key
        id_value = response_data.get('id', None)
        if id_value is not None:
            # Create a new feature and set the 'id' field
            feature = QgsFeature(self.layer.fields())
            feature.setAttribute('id', id_value)
            self.layer.dataProvider().addFeatures([feature])

    def run(self):
        self.ensure_layer_exists()
        # Activate the layer
        self.canvas.setCurrentLayer(self.layer)
        for feature in self.layer.getFeatures():
             self.save_polygon(feature)
        QMessageBox.information(self.iface.mainWindow(), "Success", "Polygon saved successfully!")
        # self.layer.featureAdded.connect(self.save_polygon)
        # self.layer.featureModified.connect(self.save_polygon)
        

    def save_polygon(self, feature):
        try:
            attributes = {field.name(): feature[field.name()].toPyObject() for field in self.layer.fields()}
            # Include 'id' field only if it has a non-null value
            if 'id' in attributes and attributes['id'] is not None:
                attributes['id'] = feature['id']
            attributes['geom'] = json.loads(feature.geometry().asJson())
            print(f"Sending attributes to API: {attributes}")
            response = requests.post('http://localhost:3000/add-plot', json=attributes)
            print(f"API response: {response.status_code}, {response.text}")
            if response.status_code == 200:
                response_data = response.json()
                if 'id' in response_data:
                    self.layer.startEditing()
                    feature.setAttribute('id', response_data['id'])
                    self.layer.updateFeature(feature)
                    self.layer.commitChanges()
                
            else:
                QMessageBox.critical(self.iface.mainWindow(), "Error", "Failed to save polygon.")
        except Exception as e:
            print(f"Error saving polygon: {e}")
            QMessageBox.critical(self.iface.mainWindow(), "Error", f"Failed to save polygon: {e}")

# Initialize the plugin
def classFactory(iface):
    return SavePolygonPlugin(iface)