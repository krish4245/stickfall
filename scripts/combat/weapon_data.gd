extends Resource
class_name WeaponData

## Data-driven weapon definition.
## Create .tres files from this to define different weapons.

@export var weapon_name: String = "Sword"
@export var damage: float = 20.0
@export var knockback: float = 300.0
@export var attack_speed: float = 1.0
@export var range_pixels: float = 60.0
@export var cooldown: float = 0.35
@export var description: String = ""
