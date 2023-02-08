import './gmxStyles.css';
import {gmxAPIutils} from './Utils.js';
import './Parsers.js';
import './Deferred.js';
import './ImageBitmapLoader.js';
import './ImageLoader.js';
import './DrawCanvas.js';
import './SessionManager.js';
import './MapManager.js';
import './GeomixerMap.js';
import './EventsManager.js';
import './Locale.js';
import './lang_ru.js';
import './lang_en.js';

import './DataManager/VectorTileLoader.js';
import './DataManager/VectorTile.js';
import './DataManager/Observer.js';
import './DataManager/TilesTree.js';
import './DataManager/DataManager.js';

import './Layer/VectorLayer.js';
import './Layer/ScreenVectorTile.js';
import './Layer/ObjectsReorder.js';
import './Layer/StyleManager.js';
import './Layer/VectorLayer.Popup.js';
import './Layer/VectorLayer.Hover.js';
import './Layer/LayersVersion.js';
import './Layer/RasterLayer.js';
import './Layer/LabelsLayer.js';
import './Layer/ClipPolygon.js';
import './Layer/ImageTransform.js';
import './Layer/ProjectiveImageWebGL.js';
import './Layer/ProjectiveImage.js';

import './Layer/external/RotatedMarker.js';
import './Layer/external/ExternalLayer.js';
import './Layer/external/BindWMS.js';
import './Layer/external/HeatMap.js';
import './Layer/external/MarkerCluster.js';
import './Layer/external/GridCluster.js';
import './Layer/external/earcut.js';

import './LayerFactory.js';
L.gmx = L.gmx || {};
L.gmx.gmxAPIutils = gmxAPIutils;