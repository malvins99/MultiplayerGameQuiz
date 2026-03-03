"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapParser = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class MapParser {
    static loadMapData(difficulty) {
        let filename = 'map_easy.json';
        if (difficulty === 'sedang')
            filename = 'map_medium.json';
        if (difficulty === 'sulit')
            filename = 'map_hard.json';
        const mapPath = path_1.default.join(__dirname, '..', 'maps', filename);
        try {
            const rawData = fs_1.default.readFileSync(mapPath, 'utf-8');
            const map = JSON.parse(rawData);
            return {
                playerSpawns: this.findLayerObjects(map.layers, 'spawn players').concat(this.findLayerObjects(map.layers, 'spawn point')),
                enemySpawnZones: this.findLayerObjects(map.layers, 'enemies spawn').concat(this.findLayerObjects(map.layers, 'enemies')),
                chests: this.findLayerObjects(map.layers, 'chest'),
                mapWidth: map.width * map.tilewidth,
                mapHeight: map.height * map.tileheight
            };
        }
        catch (error) {
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
    static findLayerObjects(layers, layerName) {
        let results = [];
        for (const layer of layers) {
            // Case 1: The layer itself matches the name and is an ObjectGroup
            if (layer.name.toLowerCase() === layerName.toLowerCase() && layer.type === 'objectgroup') {
                const objects = layer.objects.map((obj) => {
                    if (obj.point)
                        return { x: obj.x, y: obj.y };
                    if (obj.width && obj.height)
                        return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
                    if (obj.polygon || obj.polyline) {
                        const points = obj.polygon || obj.polyline;
                        let minX = 0, maxX = 0, minY = 0, maxY = 0;
                        points.forEach((p) => {
                            if (p.x < minX)
                                minX = p.x;
                            if (p.x > maxX)
                                maxX = p.x;
                            if (p.y < minY)
                                minY = p.y;
                            if (p.y > maxY)
                                maxY = p.y;
                        });
                        return { x: obj.x + minX, y: obj.y + minY, width: maxX - minX, height: maxY - minY };
                    }
                    return { x: obj.x, y: obj.y };
                });
                results = results.concat(objects);
            }
            // Case 2: It's a Group Layer
            if (layer.layers && layer.type === 'group') {
                // If the group matches the name, we want EVERYTHING inside it regardless of child name
                if (layer.name.toLowerCase() === layerName.toLowerCase()) {
                    const children = this.getAllObjectsFromGroup(layer);
                    results = results.concat(children);
                }
                else {
                    // Otherwise, just recurse searching for the name
                    const childResults = this.findLayerObjects(layer.layers, layerName);
                    results = results.concat(childResults);
                }
            }
        }
        return results;
    }
    static getAllObjectsFromGroup(group) {
        let objects = [];
        for (const layer of group.layers) {
            if (layer.type === 'objectgroup') {
                const layerObjs = layer.objects.map((obj) => {
                    if (obj.point)
                        return { x: obj.x, y: obj.y };
                    if (obj.width && obj.height)
                        return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
                    return { x: obj.x, y: obj.y };
                });
                objects = objects.concat(layerObjs);
            }
            else if (layer.type === 'group') {
                objects = objects.concat(this.getAllObjectsFromGroup(layer));
            }
        }
        return objects;
    }
}
exports.MapParser = MapParser;
