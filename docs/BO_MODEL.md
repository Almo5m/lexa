# Bo, the 3D robot

Bo is drawn with real 3D geometry in the browser (three.js): glossy shell, dark glass face, glowing eyes and antenna, with moods (happy, neutral, sad, thinking), blinking, floating, and a slight turn toward the pointer.

The code is in `src/features/bo/scene.ts` (the scene) and `src/components/bo-robot.tsx` (the component). The 3D library loads only when Bo appears on screen. He pauses when he is off screen or the tab is hidden, stays still for people who asked for less motion, and a flat face replaces him if the device has no WebGL.

## Replacing him with a model made in Blender

1. Model Bo in Blender, about 8,000 triangles at most, with PBR materials (base color, roughness, metalness, emissive for the eyes).
2. Export as glTF Binary (`.glb`) with Draco compression off for now, and name it `bo.glb`.
3. Put it at `public/bo/bo.glb`.

That is all. When the file exists, the app loads it in place of the built-in robot, scales it to fit, and keeps the floating and the turn toward the pointer. Moods that move the face (eyes, mouth, antenna) belong to the built-in robot; for the Blender model they can be added later as named animations or shape keys (`happy`, `sad`, `thinking`). To go back to the built-in robot, delete the file.

Keep the file under 1.5 MB so the first screen stays fast on a phone.
