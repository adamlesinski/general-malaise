package main

import (
	"fmt"
	"math/rand"
	"sort"
)

type Action struct {
	Deploy    *DeployAction    `json:"deploy,omitempty"`
	Attack    *AttackAction    `json:"attack,omitempty"`
	EndAttack *EndAttackAction `json:"end_attack,omitempty"`
	Advance   *MoveAction      `json:"advance,omitempty"`
	Reinforce *MoveAction      `json:"reinforce,omitempty"`
}

type DeployAction struct {
	Player      string            `json:"player"`
	Deployments map[string]uint64 `json:"deployments"`
}

type AttackAction struct {
	Player string `json:"player"`
	From   string `json:"from"`
	To     string `json:"to"`
}

type EndAttackAction struct {
	Player string `json:"player"`
}

type MoveAction struct {
	Player string `json:"player"`
	From   string `json:"from"`
	To     string `json:"to"`
	Troops uint64 `json:"troops"`
}

type Event struct {
	Deploy       *DeployAction      `json:"deploy,omitempty"`
	Attack       *AttackEvent       `json:"attack,omitempty"`
	Advance      *MoveAction        `json:"advance,omitempty"`
	Reinforce    *MoveAction        `json:"reinforce,omitempty"`
	PhaseChanged *PhaseChangedEvent `json:"phase_changed,omitempty"`
}

type DeployEvent struct {
	Player      string            `json:"player"`
	Deployments map[string]uint64 `json:"deployments"`
}

type AttackEvent struct {
	AttackAction
	Defender       string `json:"defender"`
	AttackerDice   []int  `json:"attacker_dice"`
	DefenderDice   []int  `json:"defender_dice"`
	AttackerLosses uint64 `json:"attacker_losses"`
	DefenderLosses uint64 `json:"defender_losses"`
	Conquered      bool   `json:"conquered"`
}

type PhaseChangedEvent struct {
	OldPlayer string `json:"old_player"`
	NewPlayer string `json:"new_player"`
	OldPhase  string `json:"old_phase"`
	NewPhase  string `json:"new_phase"`
}

type TerritoryMut struct {
	Owner  string `json:"owner"`
	Troops uint64 `json:"troops"`
}

type Player struct {
	Name       string `json:"name"`
	Eliminated bool   `json:"eliminated"`
}

type GameState struct {
	Phase        string                   `json:"phase"`
	AdvanceFrom  string                   `json:"advance_from,omitempty"`
	AdvanceTo    string                   `json:"advance_to,omitempty"`
	ActivePlayer string                   `json:"active_player"`
	Players      []*Player                `json:"players"`
	Territs      map[string]*TerritoryMut `json:"territs"`
	Map          string                   `json:"map"`
}

func NewGameState(player string, playerNames []string) GameState {
	var players []*Player
	for idx := range playerNames {
		players = append(players, &Player{
			Name: playerNames[idx],
		})
	}
	return GameState{
		Phase:        "deploy",
		ActivePlayer: player,
		Players:      players,
		Territs:      make(map[string]*TerritoryMut),
		Map:          "alpha",
	}
}

func (g *GameState) selectNextPlayer() {
	for idx := range g.Players {
		if g.Players[idx].Name == g.ActivePlayer {
			nextIdx := idx
			for {
				nextIdx = (nextIdx + 1) % len(g.Players)
				if !g.Players[nextIdx].Eliminated {
					g.ActivePlayer = g.Players[nextIdx].Name
					return
				}
			}
		}
	}
}

func (g *GameState) ApplyAction(m *Map, action *Action) ([]*Event, error) {
	switch g.Phase {
	case "deploy":
		return g.applyDeployAction(action.Deploy)
	case "attack":
		if action.EndAttack != nil {
			return g.applyEndAttackAction(action.EndAttack)
		}
		return g.applyAttackAction(m, action.Attack)
	case "advance":
		return g.applyAdvanceAction(action.Advance)
	case "reinforce":
		return g.applyReinforceAction(m, action.Reinforce)
	default:
		panic("invalid game phase")
	}
}

func (g *GameState) applyDeployAction(deploy *DeployAction) ([]*Event, error) {
	if deploy == nil {
		return nil, fmt.Errorf("action does not apply to 'deploy' phase")
	}
	if g.ActivePlayer != deploy.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	for territ, troops := range deploy.Deployments {
		territMut, found := g.Territs[territ]
		if !found {
			return nil, fmt.Errorf("territory '%s' does not exist", territ)
		}
		if territMut.Owner != deploy.Player {
			return nil, fmt.Errorf("territory '%s' does not belong to you", territ)
		}
		territMut.Troops += troops
	}
	g.Phase = "attack"
	return []*Event{
		{Deploy: deploy},
		{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: deploy.Player,
			NewPlayer: deploy.Player,
			OldPhase:  "deploy",
			NewPhase:  "attack",
		}},
	}, nil
}

func min(a uint64, b uint64) uint64 {
	if a < b {
		return a
	}
	return b
}

type DiceRoll struct {
	dice []int
}

func RollDice(num uint64) DiceRoll {
	dice := make([]int, num)
	for die := range dice {
		dice[die] = (rand.Int() % 6) + 1
	}
	sort.Sort(sort.Reverse(sort.IntSlice(dice)))
	return DiceRoll{dice}
}

func (attacker *DiceRoll) ResolveAgainstDefender(defender *DiceRoll) (uint64, uint64) {
	numDice := len(attacker.dice)
	if numDice > len(defender.dice) {
		numDice = len(defender.dice)
	}
	var attacker_loss uint64
	var defender_loss uint64
	for die := 0; die < numDice; die += 1 {
		if attacker.dice[die] > defender.dice[die] {
			defender_loss += 1
		} else {
			attacker_loss += 1
		}
	}
	return attacker_loss, defender_loss
}

func (g *GameState) applyAttackAction(m *Map, attack *AttackAction) ([]*Event, error) {
	if attack == nil {
		return nil, fmt.Errorf("action does not apply to 'attack' phase")
	}
	if g.ActivePlayer != attack.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	from, found := g.Territs[attack.From]
	if !found {
		return nil, fmt.Errorf("territory '%s' does not exist", attack.From)
	}
	if from.Owner != attack.Player {
		return nil, fmt.Errorf("territory '%s' does not belong to you", attack.From)
	}
	to, found := g.Territs[attack.To]
	if !found {
		return nil, fmt.Errorf("territory '%s' does not exist", attack.To)
	}
	if to.Owner == attack.Player {
		return nil, fmt.Errorf("target territory of attack '%s' belongs to you", attack.To)
	}
	if from.Troops <= 1 {
		return nil, fmt.Errorf("not enough troops in territory '%s' to attack", attack.From)
	}
	if !m.IsAdjacent(attack.From, attack.To) {
		return nil, fmt.Errorf("territory '%s' is not attackable from '%s'", attack.To, attack.From)
	}
	attackerDieRolls := RollDice(min(from.Troops-1, 3))
	defenderDieRolls := RollDice(min(to.Troops, 2))
	attacker_loss, defender_loss := attackerDieRolls.ResolveAgainstDefender(&defenderDieRolls)
	from.Troops -= attacker_loss
	to.Troops -= defender_loss
	events := []*Event{
		{
			Attack: &AttackEvent{
				AttackAction:   *attack,
				Defender:       to.Owner,
				AttackerDice:   attackerDieRolls.dice,
				DefenderDice:   defenderDieRolls.dice,
				AttackerLosses: attacker_loss,
				DefenderLosses: defender_loss,
				Conquered:      to.Troops == 0,
			},
		},
	}
	if to.Troops == 0 {
		to.Owner = from.Owner
		from.Troops -= 1
		to.Troops = 1
		g.Phase = "advance"
		g.AdvanceFrom = attack.From
		g.AdvanceTo = attack.To
		events = append(events, &Event{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: attack.Player,
			NewPlayer: attack.Player,
			OldPhase:  "attack",
			NewPhase:  "advance",
		}})
	}
	return events, nil
}

func (g *GameState) applyEndAttackAction(endAttack *EndAttackAction) ([]*Event, error) {
	if endAttack == nil {
		return nil, fmt.Errorf("action does not apply to 'attack' phase")
	}
	if g.ActivePlayer != endAttack.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	g.Phase = "reinforce"
	return []*Event{
		{
			PhaseChanged: &PhaseChangedEvent{
				OldPlayer: endAttack.Player,
				NewPlayer: endAttack.Player,
				OldPhase:  "attack",
				NewPhase:  "reinforce",
			},
		},
	}, nil
}

func (g *GameState) applyAdvanceAction(advance *MoveAction) ([]*Event, error) {
	if advance == nil {
		return nil, fmt.Errorf("action does not apply to 'advance' phase")
	}
	if g.ActivePlayer != advance.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	from, found := g.Territs[advance.From]
	if !found {
		return nil, fmt.Errorf("territory '%s' does not exist", advance.From)
	}
	if from.Owner != advance.Player {
		return nil, fmt.Errorf("territory '%s' does not belong to you", advance.From)
	}
	to, found := g.Territs[advance.To]
	if !found {
		return nil, fmt.Errorf("territory '%s' does not exist", advance.To)
	}
	if to.Owner == advance.Player {
		return nil, fmt.Errorf("territory '%s' does not belong to you", advance.To)
	}
	if advance.Troops >= from.Troops {
		return nil, fmt.Errorf("territory '%s' does not have enough troops to advance", advance.From)
	}
	to.Troops += advance.Troops
	from.Troops -= advance.Troops
	g.Phase = "attack"
	g.AdvanceFrom = ""
	g.AdvanceTo = ""
	return []*Event{
		{Advance: advance},
		{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: advance.Player,
			NewPlayer: advance.Player,
			OldPhase:  "advance",
			NewPhase:  "attack",
		}},
	}, nil
}

func (g *GameState) applyReinforceAction(m *Map, reinforce *MoveAction) ([]*Event, error) {
	if reinforce == nil {
		return nil, fmt.Errorf("action does not apply to 'reinforce' phase")
	}
	if g.ActivePlayer != reinforce.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	from, found := g.Territs[reinforce.From]
	if !found {
		return nil, fmt.Errorf("territory '%s' does not exist", reinforce.From)
	}
	if from.Owner != reinforce.Player {
		return nil, fmt.Errorf("territory '%s' does not belong to you", reinforce.From)
	}
	to, found := g.Territs[reinforce.To]
	if !found {
		return nil, fmt.Errorf("territory '%s' does not exist", reinforce.To)
	}
	if to.Owner == reinforce.Player {
		return nil, fmt.Errorf("territory '%s' does not belong to you", reinforce.To)
	}
	if reinforce.Troops >= from.Troops {
		return nil, fmt.Errorf("territory '%s' does not have enough troops to reinforce", reinforce.From)
	}
	if !m.IsConnected(reinforce.From, reinforce.To) {
		return nil, fmt.Errorf("territory '%s' is not reinforceable from '%s'", reinforce.To, reinforce.From)
	}
	to.Troops += reinforce.Troops
	from.Troops -= reinforce.Troops
	g.Phase = "deploy"
	g.selectNextPlayer()
	return []*Event{
		{Reinforce: reinforce},
		{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: reinforce.Player,
			NewPlayer: g.ActivePlayer,
			OldPhase:  "reinforce",
			NewPhase:  "deploy",
		}},
	}, nil
}
