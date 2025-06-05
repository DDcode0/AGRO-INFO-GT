import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useRef } from "react";

export default function PoligonoMapa({ onPolygonCreated }) {
  // Ref para el FeatureGroup (debe estar SIEMPRE)
  const fgRef = useRef(null);

  function handleCreated(e) {
    if (e.layerType === "polygon") {
      const pts = e.layer.getLatLngs()[0].map((p) => [p.lat, p.lng]);
      // Llama al callback cuando el usuario dibuja el polígono
      onPolygonCreated?.(pts);
    }
  }

  return (
    <MapContainer
      center={[14.64, -90.51]}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FeatureGroup ref={fgRef}>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          featureGroup={fgRef.current ?? undefined}
          draw={{
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false,
            polyline: false,
            polygon: { allowIntersection: false, shapeOptions: { color: "#14b8a6" } }
          }}
          edit={{ remove: true, edit: false }}
        />
      </FeatureGroup>
    </MapContainer>
  );
}
