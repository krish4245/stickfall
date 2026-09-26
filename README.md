# STICKFALL

🥊 A 2D stickman arena fighter built with Godot 4.

## Controls

| Input | Action |
|-------|--------|
| W / Space | Jump / Double Jump |
| A | Move Left |
| D | Move Right |
| S | Drop Through Platform |
| Mouse | Aim |
| Left Click | Attack |
| Shift | Dash (later) |
| Esc | Pause |

## Tech Stack

- **Engine**: Godot 4.3
- **Language**: GDScript
- **Resolution**: 1920×1080 (16:9)

## Project Structure

```
Stickfight/
├── assets/          # Art, audio, fonts
├── scenes/          # Godot scenes (.tscn)
├── scripts/         # GDScript files (.gd)
├── data/            # Weapon/character data resources
├── shaders/         # Visual shaders
└── project.godot    # Godot project config
```

## Development Phases

1. ✅ Project setup
2. 🔲 Player movement + jumping
3. 🔲 Combat (hitbox/hurtbox)
4. 🔲 Polish (VFX, sound, screen shake)
5. 🔲 Game loop (menu, rounds, win/lose)
6. 🔲 Local multiplayer
7. 🔲 Online multiplayer
