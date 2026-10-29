# Bo, the 3D robot

There is one Bo. He is built in code with real 3D geometry in the browser (three.js): glossy shell, dark glass face, glowing eyes and antenna, with moods (happy, neutral, sad, thinking), blinking, floating, and a slight turn toward the pointer.

The code is in `src/features/bo/scene.ts` (the scene) and `src/components/bo-robot.tsx` (the component). The 3D library loads only when Bo appears on screen. He pauses when he is off screen or the tab is hidden, stays still for people who asked for less motion, and a flat face replaces him if the device has no WebGL.

The student can show or hide Bo on every screen from the Account page (`src/components/bo-visibility.tsx`).
