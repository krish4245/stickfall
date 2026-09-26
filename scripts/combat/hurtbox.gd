extends Area2D
class_name Hurtbox

## Hurtbox — attached to a player's or enemy's body.
## Represents the area that can receive damage.

var owner_entity: Node

@export var is_invulnerable: bool = false


func _ready() -> void:
	# Search upward to find parent entity
	var node: Node = self
	while node:
		if node is CharacterBody2D or node is Player:
			owner_entity = node
			break
		node = node.get_parent()
	if not owner_entity:
		owner_entity = owner
