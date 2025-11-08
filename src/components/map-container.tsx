"use client";

import type { FC } from "react";
import { useEffect, useRef, useState, memo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { latLonToVector3 } from "../lib/three-utils";
import type { GeoData, ServerLocation, CloudRegion } from "../types/geo";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

interface MapContainerProps {
  geoData: GeoData | null;
  layerVisibility: {
    servers: boolean;
    regions: boolean;
  };
}

const providerColors = {
  AWS: "#FF9900",
  GCP: "#4285F4",
  Azure: "#0078D4",
  Other: "#9E9E9E",
};

const GLOBE_RADIUS = 100;

function getLatencyColor(latency: number) {
  // Color-coded connections based on latency ranges:
  // Green for low latency (< 50ms)
  // Yellow for medium latency (50-100ms)
  // Red for high latency (> 100ms)
  if (latency < 50) return new THREE.Color("#00FF00"); // Green - Low latency
  if (latency < 100) return new THREE.Color("#FFFF00"); // Yellow - Medium latency
  return new THREE.Color("#FF0000"); // Red - High latency
}

type SelectableItem = ServerLocation | CloudRegion;

// Custom shader for glowing dashed lines
const dashedGlowShader = {
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    uniform float dashSize;
    uniform float gapSize;
    uniform float dashOffset;
    uniform float glowIntensity;
    varying vec3 vPosition;

    void main() {
      float totalSize = dashSize + gapSize;
      float pattern = mod(vPosition.x + vPosition.y + vPosition.z + dashOffset, totalSize);
      float alpha = pattern < dashSize ? 1.0 : 0.0;

      // Glow effect
      vec3 glow = glowColor * glowIntensity;
      gl_FragColor = vec4(glow, alpha);
    }
  `,
};

// Custom shader for pulsating region markers
const pulseShader = {
  vertexShader: `
    uniform float pulseTime;
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      float scale = 1.0 + 0.3 * sin(pulseTime); // Pulsing scale
      vec4 scaledPosition = vec4(position * scale, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 baseColor;
    uniform float pulseTime;
    varying vec3 vPosition;
    void main() {
      float opacity = 0.7 + 0.3 * sin(pulseTime); // Pulsing opacity
      gl_FragColor = vec4(baseColor, opacity);
    }
  `,
};

const ThreeScene: FC<MapContainerProps> = memo(
  ({ geoData, layerVisibility }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    const [selectedItem, setSelectedItem] = useState<SelectableItem | null>(
      null
    );
    const [hoveredItem, setHoveredItem] = useState<SelectableItem | null>(null);

    const markersGroupRef = useRef(new THREE.Group());
    const linesGroupRef = useRef(new THREE.Group());
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2(-100, -100));
    const intersectedRef = useRef<THREE.Object3D | null>(null);
    const dashOffsetRef = useRef<number>(0);
    const pulseTimeRef = useRef<number>(0);

    useEffect(() => {
      if (!mountRef.current) return;
      if (rendererRef.current) return; // Prevent re-initialization

      const mountNode = mountRef.current;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        50,
        mountNode.clientWidth / mountNode.clientHeight,
        0.1,
        2000
      );
      camera.position.z = window.innerWidth < 768 ? 350 : 250;
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountNode.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight.position.set(5, 3, 5);
      scene.add(directionalLight);

      const starsGeometry = new THREE.BufferGeometry();
      const starsVertices = [];
      for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starsVertices.push(x, y, z);
      }
      starsGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starsVertices, 3)
      );
      const starsMaterial = new THREE.PointsMaterial({
        color: 0x888888,
        size: window.innerWidth < 768 ? 0.5 : 0.7,
        transparent: true,
        opacity: 0.8,
      });
      const starField = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(starField);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.load("earth.jpg", (texture) => {
        const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
        const globeMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.3,
          roughness: 0.7,
        });
        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        scene.add(globe);
      });

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = window.innerWidth < 768 ? 150 : 120;
      controls.maxDistance = window.innerWidth < 768 ? 500 : 400;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controlsRef.current = controls;

      scene.add(markersGroupRef.current);
      scene.add(linesGroupRef.current);

      const onMouseMove = (event: MouseEvent) => {
        if (!rendererRef.current) return;
        const rect = rendererRef.current.domElement.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y =
          -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onClick = () => {
        if (intersectedRef.current) {
          const { data } = intersectedRef.current.userData;
          setSelectedItem(data);
          if (controlsRef.current) controlsRef.current.autoRotate = false;
        } else {
          setSelectedItem(null);
        }
      };

      renderer.domElement.addEventListener("mousemove", onMouseMove);
      renderer.domElement.addEventListener("click", onClick);

      let animationFrameId: number;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();

        // Animate dashed lines with glow
        dashOffsetRef.current += 0.15;
        linesGroupRef.current.children.forEach((child) => {
          const line = child as THREE.Line;
          if (line.material instanceof THREE.ShaderMaterial) {
            line.material.uniforms.dashOffset.value = dashOffsetRef.current;
          }
        });

        // Animate pulse for region markers
        pulseTimeRef.current += 0.05;
        markersGroupRef.current.children.forEach((child) => {
          const marker = child as THREE.Mesh;
          if (
            marker.userData.type === "region" &&
            marker.material instanceof THREE.ShaderMaterial
          ) {
            marker.material.uniforms.pulseTime.value = pulseTimeRef.current;
          }
        });

        starField.rotation.y += 0.0001;
        starField.rotation.x += 0.00005;

        if (cameraRef.current) {
          raycasterRef.current.setFromCamera(
            mouseRef.current,
            cameraRef.current
          );
          const intersects = raycasterRef.current.intersectObjects(
            markersGroupRef.current.children
          );

          if (intersectedRef.current) {
            const obj = intersectedRef.current as THREE.Mesh;
            if (
              obj.material &&
              (obj.material as THREE.MeshBasicMaterial).color
            ) {
              (obj.material as THREE.MeshBasicMaterial).color.set(
                (obj.userData as any).originalColor
              );
            }
            obj.scale.set(1, 1, 1);
            if (mountNode) mountNode.style.cursor = "default";
            intersectedRef.current = null;
            setHoveredItem(null);
          }

          if (intersects.length > 0) {
            intersectedRef.current = intersects[0].object;
            const obj = intersectedRef.current as THREE.Mesh;
            if (
              obj.material &&
              (obj.material as THREE.MeshBasicMaterial).color
            ) {
              (obj.userData as any).originalColor = (
                obj.material as THREE.MeshBasicMaterial
              ).color.getHex();
              (obj.material as THREE.MeshBasicMaterial).color.set(0xffffff);
            }
            obj.scale.set(1.5, 1.5, 1.5);
            if (mountNode) mountNode.style.cursor = "pointer";
            setHoveredItem(obj.userData.data);
          }
        }

        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        if (!mountNode || !cameraRef.current || !rendererRef.current) return;
        const width = mountNode.clientWidth;
        const height = mountNode.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.position.z = window.innerWidth < 768 ? 350 : 250;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        mountNode.removeEventListener("mousemove", onMouseMove);
        mountNode.removeEventListener("click", onClick);
        cancelAnimationFrame(animationFrameId);
        if (rendererRef.current?.domElement) {
          mountNode.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      };
    }, []);

    useEffect(() => {
      markersGroupRef.current.clear();
      linesGroupRef.current.clear();

      if (geoData?.servers && layerVisibility.servers) {
        geoData.servers.forEach((server) => {
          const pos = latLonToVector3(
            server.latitude,
            server.longitude,
            GLOBE_RADIUS,
            0.5
          );
          
          // Different marker shapes for different cloud providers
          let markerGeometry: THREE.BufferGeometry;
          const baseSize = window.innerWidth < 768 ? 0.8 : 1.2;
          
          switch (server.cloudProvider) {
            case "AWS":
              // Box shape for AWS
              markerGeometry = new THREE.BoxGeometry(
                baseSize * 1.2,
                baseSize * 1.2,
                baseSize * 1.2
              );
              break;
            case "GCP":
              // Sphere shape for GCP
              markerGeometry = new THREE.SphereGeometry(baseSize, 16, 16);
              break;
            case "Azure":
              // Octahedron shape for Azure
              markerGeometry = new THREE.OctahedronGeometry(baseSize, 0);
              break;
            default:
              // Cylinder shape for Other
              markerGeometry = new THREE.CylinderGeometry(
                baseSize * 0.8,
                baseSize * 0.8,
                baseSize * 1.5,
                8
              );
              break;
          }
          
          const markerMaterial = new THREE.MeshBasicMaterial({
            color: providerColors[server.cloudProvider],
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(pos);
          marker.userData = { type: "server", data: server };
          markersGroupRef.current?.add(marker);
        });

        if (geoData.servers.length > 1) {
          for (let i = 0; i < geoData.servers.length; i++) {
            for (let j = i + 1; j < geoData.servers.length; j++) {
              const startServer = geoData.servers[i];
              const endServer = geoData.servers[j];
              const startPos = latLonToVector3(
                startServer.latitude,
                startServer.longitude,
                GLOBE_RADIUS
              );
              const endPos = latLonToVector3(
                endServer.latitude,
                endServer.longitude,
                GLOBE_RADIUS
              );

              const distance = startPos.distanceTo(endPos);
              const midPoint = startPos.clone().lerp(endPos, 0.5);
              midPoint
                .normalize()
                .multiplyScalar(GLOBE_RADIUS + distance * 0.25);

              const curve = new THREE.QuadraticBezierCurve3(
                startPos,
                midPoint,
                endPos
              );

              const points = curve.getPoints(50);
              const geometry = new THREE.BufferGeometry().setFromPoints(points);

              const averageLatency =
                (startServer.latency + endServer.latency) / 2;
              const material = new THREE.ShaderMaterial({
                vertexShader: dashedGlowShader.vertexShader,
                fragmentShader: dashedGlowShader.fragmentShader,
                uniforms: {
                  glowColor: { value: getLatencyColor(averageLatency) },
                  dashSize: { value: window.innerWidth < 768 ? 3 : 6 },
                  gapSize: { value: window.innerWidth < 768 ? 3.5 : 7 },
                  dashOffset: { value: 0 },
                  glowIntensity: { value: window.innerWidth < 768 ? 1.5 : 2.0 },
                },
                transparent: true,
                linewidth: window.innerWidth < 768 ? 3 : 5,
              });
              const curveObject = new THREE.Line(geometry, material);
              linesGroupRef.current?.add(curveObject);
            }
          }
        }
      }

      if (geoData?.regions && layerVisibility.regions) {
        geoData.regions.forEach((region) => {
          const pos = latLonToVector3(
            region.latitude,
            region.longitude,
            GLOBE_RADIUS,
            0.2
          );
          const regionGeometry = new THREE.TorusGeometry(
            window.innerWidth < 768 ? 1.5 : 2.5,
            0.2,
            8,
            32
          );
          const regionColor = new THREE.Color(
            providerColors[region.provider as keyof typeof providerColors]
          );
          const regionMaterial = new THREE.ShaderMaterial({
            vertexShader: pulseShader.vertexShader,
            fragmentShader: pulseShader.fragmentShader,
            uniforms: {
              baseColor: { value: regionColor },
              pulseTime: { value: 0 },
            },
            transparent: true,
          });
          const regionMarker = new THREE.Mesh(regionGeometry, regionMaterial);
          regionMarker.position.copy(pos);
          regionMarker.lookAt(new THREE.Vector3(0, 0, 0));
          regionMarker.userData = { type: "region", data: region };
          markersGroupRef.current?.add(regionMarker);
        });
      }
    }, [geoData, layerVisibility]);

    return (
      <div className="h-full w-full relative">
        <div ref={mountRef} className="h-full w-full" />
        {selectedItem && (
          <InfoCard item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
        {hoveredItem && !selectedItem && <HoverTooltip item={hoveredItem} />}
        <Legend />
      </div>
    );
  }
);
ThreeScene.displayName = "ThreeScene";

export const MapContainer: FC<MapContainerProps> = ({
  geoData,
  layerVisibility,
}) => {
  return <ThreeScene geoData={geoData} layerVisibility={layerVisibility} />;
};

const InfoCard: FC<{ item: SelectableItem; onClose: () => void }> = ({
  item,
  onClose,
}) => {
  if ("exchange" in item) {
    return <ServerInfoCard server={item as ServerLocation} onClose={onClose} />;
  }
  if ("provider" in item && "code" in item) {
    return <RegionInfoCard region={item as CloudRegion} onClose={onClose} />;
  }
  return null;
};

const HoverTooltip: FC<{ item: SelectableItem }> = ({ item }) => {
  const isServer = "exchange" in item;
  const isRegion = "provider" in item && "code" in item;

  let title = "N/A";
  if (isServer) title = (item as ServerLocation).name;
  else if (isRegion) title = (item as CloudRegion).name;

  return (
    <Card className="pointer-events-none absolute top-2 md:top-4 left-2 md:left-1/2 -translate-x-0 md:-translate-x-1/2 z-20 w-[90vw] max-w-[20rem] shadow-2xl bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <CardHeader className="p-2 md:p-3">
        <CardTitle className="text-sm md:text-base truncate">{title}</CardTitle>
      </CardHeader>
    </Card>
  );
};

const ServerInfoCard: FC<{ server: ServerLocation; onClose: () => void }> = ({
  server,
  onClose,
}) => {
  return (
    <Card className="absolute bottom-2 md:bottom-4 right-2 md:right-4 z-10 w-[90vw] max-w-[20rem] shadow-2xl animate-in fade-in-0 zoom-in-95">
      <CardHeader className="flex flex-row items-start justify-between pb-1 md:pb-2">
        <CardTitle className="text-sm md:text-base leading-tight">
          {server.name}
        </CardTitle>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xl md:text-2xl -mt-1 md:-mt-2"
        >
          ×
        </button>
      </CardHeader>
      <CardContent className="text-xs md:text-sm space-y-1 md:space-y-2">
        <div>
          <strong>Exchange:</strong> {server.exchange}
        </div>
        <div>
          <strong>Location:</strong> {server.city}, {server.country}
        </div>
        <div>
          <strong>Latency:</strong>{" "}
          <span
            className="font-bold text-base md:text-lg"
            style={{ color: getLatencyColor(server.latency).getStyle() }}
          >
            {server.latency} ms
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <strong>Provider:</strong>
          <Badge
            variant="secondary"
            style={{
              backgroundColor: providerColors[server.cloudProvider],
              color: "#fff",
              textShadow: "0 0 3px black",
            }}
          >
            {server.cloudProvider}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const RegionInfoCard: FC<{ region: CloudRegion; onClose: () => void }> = ({
  region,
  onClose,
}) => {
  return (
    <Card className="absolute bottom-2 md:bottom-4 right-2 md:right-4 z-10 w-[90vw] max-w-[20rem] shadow-2xl animate-in fade-in-0 zoom-in-95">
      <CardHeader className="flex flex-row items-start justify-between pb-1 md:pb-2">
        <CardTitle className="text-sm md:text-base leading-tight">
          {region.name}
        </CardTitle>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xl md:text-2xl -mt-1 md:-mt-2"
        >
          ×
        </button>
      </CardHeader>
      <CardContent className="text-xs md:text-sm space-y-1 md:space-y-2">
        <div>
          <strong>Region Code:</strong> {region.code}
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <strong>Provider:</strong>
          <Badge
            variant="secondary"
            style={{
              backgroundColor: providerColors[region.provider],
              color: "#fff",
              textShadow: "0 0 3px black",
            }}
          >
            {region.provider}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const Legend: FC = () => {
  return (
    <Card className="absolute top-20 md:top-24 right-2 md:right-4 z-10 w-[85vw] max-w-[16rem] md:max-w-[18rem] shadow-2xl bg-background/95 backdrop-blur-sm border border-border/50 animate-in fade-in-0">
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="text-xs md:text-sm font-semibold flex items-center gap-2">
          <span className="text-primary">📊</span>
          Server Markers Legend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 text-xs md:text-sm">
        <div className="space-y-2">
          <div className="font-semibold text-xs md:text-sm text-foreground mb-2 uppercase tracking-wide">
            Cloud Providers:
          </div>
          
          {/* AWS - Box */}
          <div className="flex items-center gap-2 md:gap-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <div
              className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 border border-border/50 shadow-sm"
              style={{
                backgroundColor: providerColors.AWS,
                clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
              }}
            />
            <span className="flex-1 font-medium">AWS (Box)</span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5"
              style={{
                backgroundColor: providerColors.AWS,
                color: "#fff",
              }}
            >
              AWS
            </Badge>
          </div>
          
          {/* GCP - Sphere */}
          <div className="flex items-center gap-2 md:gap-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <div
              className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 rounded-full border border-border/50 shadow-sm"
              style={{ backgroundColor: providerColors.GCP }}
            />
            <span className="flex-1 font-medium">GCP (Sphere)</span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5"
              style={{
                backgroundColor: providerColors.GCP,
                color: "#fff",
              }}
            >
              GCP
            </Badge>
          </div>
          
          {/* Azure - Octahedron */}
          <div className="flex items-center gap-2 md:gap-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <div
              className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 border border-border/50 shadow-sm"
              style={{
                backgroundColor: providerColors.Azure,
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              }}
            />
            <span className="flex-1 font-medium">Azure (Diamond)</span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5"
              style={{
                backgroundColor: providerColors.Azure,
                color: "#fff",
              }}
            >
              Azure
            </Badge>
          </div>
          
          {/* Other - Cylinder */}
          <div className="flex items-center gap-2 md:gap-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <div
              className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 rounded-sm border border-border/50 shadow-sm"
              style={{ backgroundColor: providerColors.Other }}
            />
            <span className="flex-1 font-medium">Other (Cylinder)</span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5"
              style={{
                backgroundColor: providerColors.Other,
                color: "#fff",
              }}
            >
              Other
            </Badge>
          </div>
        </div>
        
        <div className="border-t border-border pt-3 mt-3">
          <div className="font-semibold text-xs md:text-sm text-foreground mb-2 uppercase tracking-wide">
            Connection Colors:
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 md:gap-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
              <div
                className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 rounded-sm border border-border/50 shadow-sm"
                style={{ backgroundColor: "#00FF00" }}
              />
              <span className="flex-1 font-medium">Low Latency (&lt;50ms)</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
              <div
                className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 rounded-sm border border-border/50 shadow-sm"
                style={{ backgroundColor: "#FFFF00" }}
              />
              <span className="flex-1 font-medium">Medium Latency (50-100ms)</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
              <div
                className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 rounded-sm border border-border/50 shadow-sm"
                style={{ backgroundColor: "#FF0000" }}
              />
              <span className="flex-1 font-medium">High Latency (&gt;100ms)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
