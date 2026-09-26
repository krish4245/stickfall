extends CharacterBody2D
class_name TrainingDummy

## Training dummy for combat practice.
## Reacts to hits, plays hit/death animations, and auto-resets when defeated.

@export var max_health: float = 100.0
@export var gravity: float = 1200.0
@export var friction: float = 1400.0

var is_dead: bool = false
var spawn_pos: Vector2

@onready var visual: Node2D = $Visual
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var health_component: HealthComponent = $HealthComponent
@onready var overhead_bar: ProgressBar = $OverheadUI/ProgressBar


func _ready() -> void:
	spawn_pos = global_position
	# Setup shared stickman animations
	PlayerAnimations.setup_animations(animation_player)
	animation_player.play("idle")

	health_component.max_health = max_health
	health_component.current_health = max_health
	health_component.health_changed.connect(_on_health_changed)
	health_component.died.connect(_on_died)

	if overhead_bar:
		overhead_bar.max_value = max_health
		overhead_bar.value = max_health


func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity.y = minf(velocity.y + gravity * delta, 900.0)

	velocity.x = move_toward(velocity.x, 0.0, friction * delta)
	move_and_slide()


func apply_knockback(direction: Vector2, force: float) -> void:
	velocity = direction.normalized() * force


func _on_health_changed(new_hp: float, max_hp: float) -> void:
	if overhead_bar:
		overhead_bar.max_value = max_hp
		overhead_bar.value = new_hp
	if not is_dead and animation_player:
		animation_player.play("hit")
		await animation_player.animation_finished
		if not is_dead:
			animation_player.play("idle")


func _on_died() -> void:
	if is_dead:
		return
	is_dead = true
	if animation_player:
		animation_player.play("death")

	# Auto-respawn after 2 seconds
	var timer := get_tree().create_timer(2.0)
	timer.timeout.connect(reset_dummy)


func reset_dummy() -> void:
	is_dead = false
	global_position = spawn_pos
	velocity = Vector2.ZERO
	modulate = Color.WHITE
	health_component.reset()
	if animation_player:
		animation_player.play("idle")
