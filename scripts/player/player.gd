extends CharacterBody2D
class_name Player

## Player — main character controller.
## Uses a state machine for clean state management.
## Faces the mouse cursor. Attacks with left click.

# ─── Movement ───────────────────────────────────────────
@export var speed: float = 400.0
@export var acceleration: float = 2000.0
@export var friction: float = 1800.0
@export var gravity: float = 1200.0
@export var jump_force: float = 500.0
@export var max_fall_speed: float = 900.0
@export var double_jump_force: float = 420.0

# ─── Combat ─────────────────────────────────────────────
@export var attack_damage: float = 12.0
@export var attack_knockback: float = 350.0

# ─── State ──────────────────────────────────────────────
var can_double_jump: bool = true
var facing_right: bool = true
var is_attacking: bool = false
var is_dead: bool = false
var attack_landed: bool = false

# ─── References ─────────────────────────────────────────
@onready var state_machine: PlayerStateMachine = $StateMachine
@onready var visual: Node2D = $Visual
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var hitbox: Area2D = $Visual/Hitbox
@onready var hurtbox: Area2D = $Hurtbox
@onready var health_component: Node = $HealthComponent
@onready var weapon_pivot: Node2D = $Visual/WeaponPivot

func _ready() -> void:
	add_to_group("players")
	GameManager.register_player(self)
	hitbox.monitoring = false
	hitbox.monitorable = false
	# Build all animations from code (idle, run, jump, fall, attack, etc.)
	PlayerAnimations.setup_animations(animation_player)


func _exit_tree() -> void:
	GameManager.unregister_player(self)


func _physics_process(delta: float) -> void:
	# Apply gravity
	if not is_on_floor():
		velocity.y = minf(velocity.y + gravity * delta, max_fall_speed)

	# Face the mouse (only if not dead)
	if not is_dead:
		var mouse_pos := get_global_mouse_position()
		if mouse_pos.x > global_position.x and not facing_right:
			_flip(true)
		elif mouse_pos.x < global_position.x and facing_right:
			_flip(false)

		# Aim weapon toward mouse (only when not attacking)
		if weapon_pivot and not is_attacking:
			var angle := global_position.angle_to_point(mouse_pos)
			if not facing_right:
				angle += PI
			weapon_pivot.rotation = angle

	move_and_slide()


func _flip(right: bool) -> void:
	facing_right = right
	visual.scale.x = 1.0 if right else -1.0


func apply_knockback(direction: Vector2, force: float) -> void:
	velocity = direction.normalized() * force


func die() -> void:
	is_dead = true
	state_machine.transition_to("DeathState")
