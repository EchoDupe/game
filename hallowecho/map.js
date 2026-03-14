/**
 * HallowEcho Map Definition - Optimized for Raycasting
 */
const houseData = {
    // 0 = Floor, 1 = Plaster Wall, 2 = Kitchen Wall
    floor1: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 2, 2, 2, 1], 
        [1, 0, 0, 0, 0, 0, 0, 0, 2, 1], 
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 0, 2, 2, 2, 2, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 2, 2, 0, 0, 0, 0, 0, 1], 
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // Spawning in a safe '0' tile
    spawn: { x: 4.5, y: 8.5, dir: -Math.PI / 2 }
};

/**
 * Decor Objects - X and Y are tile coordinates.
 * These are rendered as "Billboards" (sprites).
 */
const decorObjects = [
    // Placed near the kitchen walls (Tile type 2 area)
    { x: 7.5, y: 1.5, img: 'broken_refrigerator.png', scale: 1.0 },
    { x: 3.5, y: 2.5, img: 'rusted_stove.png', scale: 0.8 },
    { x: 5.5, y: 6.5, img: 'grimy_kitchen_sink.png', scale: 0.8 },
    
    // Adding some atmosphere to empty spots
    { x: 1.5, y: 1.5, img: 'organic_remains_pile.png', scale: 0.6 },
    { x: 8.5, y: 8.5, img: 'tipped_over_chair.png', scale: 0.7 }
];