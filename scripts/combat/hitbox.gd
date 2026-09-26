extends Area2D
class_name Hitbox

## Hitbox — attached to an attack.
## Detects overlap with Hurtbox areas.

@export var damage: float = 12.0
@export var knockback_force: float = 350.0

var owner_entity: Node


func _ready() -> void:
	# Find the owning entity node
	var node: Node = self
	while node:
		if node is CharacterBody2D or node is Player:
			owner_entity = node
			break
		node = node.get_parent()
	if not owner_entity:
		owner_entity = owner

	area_entered.connect(_on_area_entered)


func _on_area_entered(area: Area2D) -> void:
	if area is Hurtbox:
		var hurtbox: Hurtbox = area as Hurtbox
		# Don't hit yourself
		if hurtbox.owner_entity and hurtbox.owner_entity == owner_entity:
			return

		var direction := (hurtbox.global_position - global_position).normalized()
		if direction == Vector2.ZERO:
			direction = Vector2.RIGHT

		var hit_data := {
			"damage": damage,
			"knockback_force": knockback_force,
			"direction": direction,
			"attacker": owner_entity,
			"victim": hurtbox.owner_entity,
			"hit_position": hurtbox.global_position
		}
		HitManager.process_hit(hit_data)
