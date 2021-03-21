package main

import (
	"fmt"
	"math/rand"
	"sort"
)

type Action struct {
	Deploy       *DeployAction   `json:"deploy,omitempty"`
	Attack       *AttackAction   `json:"attack,omitempty"`
	EndAttack    *EndPhaseAction `json:"end_attack,omitempty"`
	Advance      *MoveAction     `json:"advance,omitempty"`
	Reinforce    *MoveAction     `json:"reinforce,omitempty"`
	EndReinforce *EndPhaseAction `json:"end_reinforce,omitempty"`
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

type EndPhaseAction struct {
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
	StatsChanged *StatsChangedEvent `json:"stats_changed,omitempty"`
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
	OldPhase  Phase  `json:"old_phase"`
	NewPhase  Phase  `json:"new_phase"`
}

type StatsChangedEvent struct {
	Updates map[string]*StatsUpdate `json:"updates"`
}

type StatsUpdate struct {
	Territories    uint64 `json:"territories"`
	Troops         uint64 `json:"troops"`
	Reinforcements uint64 `json:"reinforcements"`
}

type TerritoryMut struct {
	Owner  string `json:"owner"`
	Troops uint64 `json:"troops"`
}

type Player struct {
	Name           string `json:"name"`
	Color          string `json:"color"`
	Eliminated     bool   `json:"eliminated"`
	Reinforcements uint64 `json:"reinforcements"`
	Troops         uint64 `json:"troops"`
	Territories    uint64 `json:"territories"`
}

type Phase struct {
	Lobby     *LobbyPhase     `json:"lobby,omitempty"`
	Deploy    *DeployPhase    `json:"deploy,omitempty"`
	Attack    *AttackPhase    `json:"attack,omitempty"`
	Advance   *AdvancePhase   `json:"advance,omitempty"`
	Reinforce *ReinforcePhase `json:"reinforce,omitempty"`
}

type LobbyPhase struct {
}

type DeployPhase struct {
	Reinforcements uint64 `json:"reinforcements"`
}

type AttackPhase struct{}

type AdvancePhase struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type ReinforcePhase struct{}

type GameState struct {
	Phase        Phase                    `json:"phase"`
	ActivePlayer string                   `json:"active_player"`
	Players      []*Player                `json:"players"`
	Territs      map[string]*TerritoryMut `json:"territs"`
	Map          string                   `json:"map"`
}

func NewGameState(player string, playerNames []string, mapName string) GameState {
	COLORS := []string{"red", "blue", "green", "yellow"}
	var players []*Player
	for idx := range playerNames {
		players = append(players, &Player{
			Name:  playerNames[idx],
			Color: COLORS[idx],
		})
	}
	return GameState{
		Phase:        Phase{Lobby: &LobbyPhase{}},
		ActivePlayer: player,
		Players:      players,
		Territs:      make(map[string]*TerritoryMut),
		Map:          mapName,
	}
}

func (g *GameState) Start(m *Map) error {
	if g.Phase.Lobby == nil {
		return fmt.Errorf("game is already started")
	}
	g.initialDeploy(m)
	g.calculateStats(m)
	g.ActivePlayer = g.Players[0].Name
	g.Phase = Phase{Deploy: &DeployPhase{
		Reinforcements: g.findPlayer(g.ActivePlayer).Reinforcements,
	}}
	return nil
}

func (g *GameState) findPlayer(name string) *Player {
	for idx := range g.Players {
		if g.Players[idx].Name == name {
			return g.Players[idx]
		}
	}
	return nil
}

func (g *GameState) initialDeploy(m *Map) {
	var territs []string
	for territName := range m.Territs {
		territs = append(territs, territName)
	}
	rand.Shuffle(len(territs), func(i int, j int) {
		tmp := territs[i]
		territs[i] = territs[j]
		territs[j] = tmp
	})
	playerCount := len(g.Players)
	for idx := range territs {
		g.Territs[territs[idx]] = &TerritoryMut{
			Owner:  g.Players[idx%playerCount].Name,
			Troops: 3,
		}
	}
}

func (g *GameState) calculateStats(m *Map) {
	playerTerritCount := make(map[string]struct {
		territs uint64
		troops  uint64
	})
	for _, territ := range g.Territs {
		counter := playerTerritCount[territ.Owner]
		counter.territs += 1
		counter.troops += territ.Troops
		playerTerritCount[territ.Owner] = counter
	}
	for idx := range g.Players {
		player := g.Players[idx]
		counter := playerTerritCount[g.Players[idx].Name]
		player.Territories = counter.territs
		player.Troops = counter.troops
		player.Reinforcements = player.Territories / 3
		if player.Reinforcements < 3 {
			player.Reinforcements = 3
		}

		// Calculate region bonuses
		for _, region := range m.Regions {
			if g.playerOwnsRegion(player.Name, region) {
				player.Reinforcements += region.Bonus
			}
		}
	}
}

func (g *GameState) playerOwnsRegion(player string, region *Region) bool {
	for _, territ := range region.Territs {
		if g.Territs[territ].Owner != player {
			return false
		}
	}
	return true
}

func (g *GameState) statsUpdate() *StatsChangedEvent {
	s := make(map[string]*StatsUpdate)
	for idx := range g.Players {
		player := g.Players[idx]
		s[player.Name] = &StatsUpdate{
			Territories:    player.Territories,
			Troops:         player.Troops,
			Reinforcements: player.Reinforcements,
		}
	}
	return &StatsChangedEvent{
		Updates: s,
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
	if g.Phase.Deploy != nil {
		return g.applyDeployAction(action.Deploy)
	} else if g.Phase.Attack != nil {
		if action.EndAttack != nil {
			return g.applyEndAttackAction(action.EndAttack)
		}
		return g.applyAttackAction(m, action.Attack)
	} else if g.Phase.Advance != nil {
		return g.applyAdvanceAction(action.Advance)
	} else if g.Phase.Reinforce != nil {
		if action.EndReinforce != nil {
			return g.applyEndReinforceAction(action.EndReinforce)
		}
		return g.applyReinforceAction(m, action.Reinforce)
	} else if g.Phase.Lobby != nil {
		return nil, fmt.Errorf("game has not been started")
	} else {
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
	player := g.findPlayer(deploy.Player)
	for territ, troops := range deploy.Deployments {
		territMut, found := g.Territs[territ]
		if !found {
			return nil, fmt.Errorf("territory '%s' does not exist", territ)
		}
		if territMut.Owner != deploy.Player {
			return nil, fmt.Errorf("territory '%s' does not belong to you", territ)
		}
		territMut.Troops += troops

		// Update the player's total troop count.
		player.Troops += troops
	}
	oldPhase := g.Phase
	g.Phase = Phase{Attack: &AttackPhase{}}
	return []*Event{
		{Deploy: deploy},
		{StatsChanged: g.statsUpdate()},
		{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: deploy.Player,
			NewPlayer: deploy.Player,
			OldPhase:  oldPhase,
			NewPhase:  g.Phase,
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

	// Update the players' total troop counts.
	fromPlayer := g.findPlayer(from.Owner)
	toPlayer := g.findPlayer(to.Owner)
	fromPlayer.Troops -= attacker_loss
	toPlayer.Troops -= defender_loss

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
		// Change ownership
		to.Owner = from.Owner
		from.Troops -= 1
		to.Troops = 1

		// Adjust all stats.
		g.calculateStats(m)

		oldPhase := g.Phase
		g.Phase = Phase{Advance: &AdvancePhase{From: attack.From, To: attack.To}}
		events = append(events, &Event{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: attack.Player,
			NewPlayer: attack.Player,
			OldPhase:  oldPhase,
			NewPhase:  g.Phase,
		}})
	}
	events = append(events, &Event{StatsChanged: g.statsUpdate()})
	return events, nil
}

func (g *GameState) applyEndAttackAction(endAttack *EndPhaseAction) ([]*Event, error) {
	if endAttack == nil {
		return nil, fmt.Errorf("action does not apply to 'attack' phase")
	}
	if g.ActivePlayer != endAttack.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	oldPhase := g.Phase
	g.Phase = Phase{Reinforce: &ReinforcePhase{}}
	return []*Event{
		{
			PhaseChanged: &PhaseChangedEvent{
				OldPlayer: endAttack.Player,
				NewPlayer: endAttack.Player,
				OldPhase:  oldPhase,
				NewPhase:  g.Phase,
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
	if to.Owner != advance.Player {
		return nil, fmt.Errorf("territory '%s' does not belong to you", advance.To)
	}
	if advance.Troops >= from.Troops {
		return nil, fmt.Errorf("territory '%s' does not have enough troops to advance", advance.From)
	}
	to.Troops += advance.Troops
	from.Troops -= advance.Troops
	oldPhase := g.Phase
	g.Phase = Phase{Attack: &AttackPhase{}}
	return []*Event{
		{Advance: advance},
		{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: advance.Player,
			NewPlayer: advance.Player,
			OldPhase:  oldPhase,
			NewPhase:  g.Phase,
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
	g.selectNextPlayer()
	oldPhase := g.Phase
	g.Phase = Phase{Deploy: &DeployPhase{
		Reinforcements: g.findPlayer(g.ActivePlayer).Reinforcements,
	}}
	return []*Event{
		{Reinforce: reinforce},
		{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: reinforce.Player,
			NewPlayer: g.ActivePlayer,
			OldPhase:  oldPhase,
			NewPhase:  g.Phase,
		}},
	}, nil
}

func (g *GameState) applyEndReinforceAction(endReinforce *EndPhaseAction) ([]*Event, error) {
	if endReinforce == nil {
		return nil, fmt.Errorf("action does not apply to 'reinforce' phase")
	}
	if g.ActivePlayer != endReinforce.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	g.selectNextPlayer()
	oldPhase := g.Phase
	g.Phase = Phase{Deploy: &DeployPhase{
		Reinforcements: g.findPlayer(g.ActivePlayer).Reinforcements,
	}}
	return []*Event{
		{
			PhaseChanged: &PhaseChangedEvent{
				OldPlayer: endReinforce.Player,
				NewPlayer: g.ActivePlayer,
				OldPhase:  oldPhase,
				NewPhase:  g.Phase,
			},
		},
	}, nil
}
