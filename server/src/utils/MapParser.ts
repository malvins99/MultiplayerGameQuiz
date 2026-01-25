import fs from 'fs';
import path from 'path';

interface Point { x: number, y: number }
interface Rectangle { x: number, y: number, width: number, height: number }

export class MapParser {
    static loadMapData(difficulty: string) {
        let filename = 'map_easy.json';
        if (difficulty === 'sedang') filename = 'map_medium.json';
        if (difficulty === 'sulit') filename = 'map_hard.json';

        const mapPath = path.join(__dirname, '..', 'maps', filename);

        try {
            const rawData = fs.readFileSync(mapPath, 'utf-8');
            const map = JSON.parse(rawData);

            return {
                playerSpawns: this.findLayerObjects(map.layers, 'spawn point'),
                enemySpawnZones: this.findLayerObjects(map.layers, 'enemies spawn') || this.findLayerObjects(map.layers, 'enemies'),
                chests: this.findLayerObjects(map.layers, 'chest'),
                mapWidth: map.width * map.tilewidth,
                mapHeight: map.height * map.tileheight
            };
        } catch (error) {
            console.error("Error loading map:", error);
            return {
                playerSpawns: [{ x: 400, y: 300 }],
                enemySpawnZones: [{ x: 100, y: 100, width: 800, height: 600 }],
                chests: [],
                mapWidth: 1000,
                mapHeight: 1000
            };
        }
    }

    private static findLayerObjects(layers: any[], layerName: string): any[] {
        for (const layer of layers) {
            // Check if this is the target layer (ObjectGroup)
            if (layer.name.toLowerCase() === layerName.toLowerCase() && layer.type === 'objectgroup') {
                return layer.objects.map((obj: any) => {
                    // Handle Points (Tiled adds "point": true)
                    if (obj.point) {
                        return { x: obj.x, y: obj.y };
                    }
                    // Handle Rectangles
                    if (obj.width && obj.height) {
                        return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
                    }
                    // Handle Polygons/Polylines
                    if (obj.polygon || obj.polyline) {
                        const points = obj.polygon || obj.polyline;
                        let minX = 0, maxX = 0, minY = 0, maxY = 0;
                        points.forEach((p: any) => {
                            if (p.x < minX) minX = p.x;
                            if (p.x > maxX) maxX = p.x;
                            if (p.y < minY) minY = p.y;
                            if (p.y > maxY) maxY = p.y;
                        });
                        // Return bounding box for now
                        return { x: obj.x + minX, y: obj.y + minY, width: maxX - minX, height: maxY - minY };
                    }
                    return { x: obj.x, y: obj.y };
                });
            }

            // Recursively check children if it's a Group Layer
            if (layer.layers && layer.type === 'group') {
                const result = this.findLayerObjects(layer.layers, layerName);
                if (result.length > 0) return result;
            }
        }
        return [];
    }
}
