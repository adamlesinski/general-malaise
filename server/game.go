package main

import (
	"fmt"
	"math/rand"
	"sort"
)

type Action struct {
	JoinGame     *JoinGameAction  `json:"join_game,omitempty"`
	StartGame    *StartGameAction `json:"start_game,omitempty"`
	Spoils       *SpoilsAction    `json:"spoils,omitempty"`
	Deploy       *DeployAction    `json:"deploy,omitempty"`
	Attack       *AttackAction    `json:"attack,omitempty"`
	EndAttack    *EndPhaseAction  `json:"end_attack,omitempty"`
	Advance      *MoveAction      `json:"advance,omitempty"`
	Reinforce    *MoveAction      `json:"reinforce,omitempty"`
	EndReinforce *EndPhaseAction  `json:"end_reinforce,omitempty"`
}

type JoinGameAction struct {
	Player string `json:"player"`
}

type StartGameAction struct {
	Player string `json:"player"`
}

type SpoilsAction struct {
	Player string   `json:"player"`
	Spoils []string `json:"spoils"`
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
	PlayerJoined *Player            `json:"player_joined,omitempty"`
	Deploy       *DeployAction      `json:"deploy,omitempty"`
	Attack       *AttackEvent       `json:"attack,omitempty"`
	Advance      *MoveAction        `json:"advance,omitempty"`
	Reinforce    *MoveAction        `json:"reinforce,omitempty"`
	PhaseChanged *PhaseChangedEvent `json:"phase_changed,omitempty"`
	StatsChanged *StatsChangedEvent `json:"stats_changed,omitempty"`
	Snapshot     *GameState         `json:"snapshot,omitempty"`
}

func (e Event) RedactForPlayer(playerName string) *Event {
	redactedEvent := Event(e)
	if e.Snapshot != nil {
		redactedEvent.Snapshot = e.Snapshot.RedactForPlayer(playerName)
	} else if e.StatsChanged != nil {
		redactedEvent.StatsChanged = e.StatsChanged.RedactForPlayer(playerName)
	}
	return &redactedEvent
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

func (e StatsChangedEvent) RedactForPlayer(playerName string) *StatsChangedEvent {
	redactedSpoil := &Spoil{
		Name:  "???",
		Color: "???",
	}
	redactedEvent := StatsChangedEvent(e)
	redactedEvent.Updates = make(map[string]*StatsUpdate)
	for key, value := range e.Updates {
		if key == playerName {
			redactedEvent.Updates[key] = value
		} else {
			redacted := StatsUpdate(*value)
			redacted.Spoils = []*Spoil{}
			for range value.Spoils {
				redacted.Spoils = append(redacted.Spoils, redactedSpoil)
			}
			redactedEvent.Updates[key] = &redacted
		}
	}
	return &redactedEvent
}

type StatsUpdate struct {
	Territories    uint64   `json:"territories"`
	Troops         uint64   `json:"troops"`
	Reinforcements uint64   `json:"reinforcements"`
	Eliminated     bool     `json:"eliminated"`
	Spoils         []*Spoil `json:"spoils"`
}

type TerritoryMut struct {
	Owner  string `json:"owner"`
	Troops uint64 `json:"troops"`
}

type Spoil struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type Player struct {
	Name           string   `json:"name"`
	Color          string   `json:"color"`
	Eliminated     bool     `json:"eliminated"`
	Reinforcements uint64   `json:"reinforcements"`
	Troops         uint64   `json:"troops"`
	Territories    uint64   `json:"territories"`
	Spoils         []*Spoil `json:"spoils"`
}

func (p *Player) HasSpoils() bool {
	red := 0
	green := 0
	blue := 0
	for idx := range p.Spoils {
		switch p.Spoils[idx].Color {
		case "red":
			red += 1
		case "green":
			green += 1
		case "blue":
			blue += 1
		}
	}
	return red >= 3 || green >= 3 || blue >= 3 || (red > 0 && green > 0 && blue > 0)
}

type Phase struct {
	Lobby     *LobbyPhase     `json:"lobby,omitempty"`
	Spoils    *SpoilsPhase    `json:"spoils,omitempty"`
	Deploy    *DeployPhase    `json:"deploy,omitempty"`
	Attack    *AttackPhase    `json:"attack,omitempty"`
	Advance   *AdvancePhase   `json:"advance,omitempty"`
	Reinforce *ReinforcePhase `json:"reinforce,omitempty"`
	GameOver  *GameOverPhase  `json:"game_over,omitempty"`
}

type LobbyPhase struct{}

type SpoilsPhase struct {
	Mandatory bool `json:"mandatory"`
}

type DeployPhase struct {
	Reinforcements uint64 `json:"reinforcements"`
}

type AttackPhase struct {
	Conquered bool `json:"conquered"`
}

type AdvancePhase struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type ReinforcePhase struct {
	Conquered bool `json:"conquered"`
}

type GameOverPhase struct {
	Winner string `json:"winner"`
}

type GameState struct {
	Phase        Phase                    `json:"phase"`
	ActivePlayer string                   `json:"active_player"`
	Players      []*Player                `json:"players"`
	Territs      map[string]*TerritoryMut `json:"territs"`
	Map          string                   `json:"map"`
	spoilPool    []*Spoil
}

func (g GameState) RedactForPlayer(playerName string) *GameState {
	redactedSpoil := &Spoil{
		Name:  "???",
		Color: "???",
	}
	var redactedPlayers []*Player
	for idx := range g.Players {
		player := g.Players[idx]
		if player.Name == playerName {
			redactedPlayers = append(redactedPlayers, player)
		} else {
			redacted := Player(*player)
			redacted.Spoils = []*Spoil{}
			for range player.Spoils {
				redacted.Spoils = append(redacted.Spoils, redactedSpoil)
			}
			redactedPlayers = append(redactedPlayers, &redacted)
		}
	}
	g.Players = redactedPlayers
	return &g
}

func NewGameState(mapName string) GameState {
	return GameState{
		Phase:   Phase{Lobby: &LobbyPhase{}},
		Territs: make(map[string]*TerritoryMut),
		Map:     mapName,
	}
}

func (g *GameState) AddPlayer(player string) (*Event, error) {
	if g.Phase.Lobby == nil {
		return nil, fmt.Errorf("game is already started")
	}

	COLORS := []string{"red", "blue", "green", "yellow", "brown", "teal"}
	if g.findPlayer(player) != nil {
		return nil, fmt.Errorf("player already joined")
	}
	newPlayer := Player{
		Name:   player,
		Color:  COLORS[len(g.Players)],
		Spoils: []*Spoil{},
	}
	g.Players = append(g.Players, &newPlayer)
	return &Event{
		PlayerJoined: &newPlayer,
	}, nil
}

func (g *GameState) Start(m *Map) (*Event, error) {
	if g.Phase.Lobby == nil {
		return nil, fmt.Errorf("game is already started")
	}

	SPOIL_COLORS := []string{"red", "blue", "green"}
	for territ, _ := range m.Territs {
		g.spoilPool = append(g.spoilPool, &Spoil{
			Name:  territ,
			Color: SPOIL_COLORS[len(g.spoilPool)%len(SPOIL_COLORS)],
		})
	}

	g.initialDeploy(m)
	g.calculateStats(m)
	g.ActivePlayer = g.Players[rand.Int()%len(g.Players)].Name
	g.Phase = Phase{Deploy: &DeployPhase{
		Reinforcements: g.findPlayer(g.ActivePlayer).Reinforcements,
	}}
	return &Event{
		Snapshot: g,
	}, nil
}

func (g *GameState) takeSpoil() *Spoil {
	idx := rand.Intn(len(g.spoilPool))
	spoil := g.spoilPool[idx]
	g.spoilPool[idx] = g.spoilPool[len(g.spoilPool)-1]
	g.spoilPool = g.spoilPool[:len(g.spoilPool)-1]
	return spoil
}

func (g *GameState) replaceSpoil(spoil *Spoil) {
	g.spoilPool = append(g.spoilPool, spoil)
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

func (g *GameState) calculateStats(m *Map) bool {
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
	eliminated := 0
	for idx := range g.Players {
		player := g.Players[idx]
		counter := playerTerritCount[g.Players[idx].Name]
		player.Territories = counter.territs
		player.Troops = counter.troops
		player.Reinforcements = player.Territories / 3
		if player.Reinforcements < 3 {
			player.Reinforcements = 3
		}
		if player.Territories == 0 {
			player.Eliminated = true
			eliminated += 1
		}

		// Calculate region bonuses
		for _, region := range m.Regions {
			if g.playerOwnsRegion(player.Name, region) {
				player.Reinforcements += region.Bonus
			}
		}
	}
	// Game over condition
	return eliminated == len(g.Players)-1
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
			Eliminated:     player.Eliminated,
			Spoils:         player.Spoils,
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
					// Check if we need to go to Spoils phase or
					// deploy.
					if g.Players[nextIdx].HasSpoils() {
						g.Phase = Phase{
							Spoils: &SpoilsPhase{Mandatory: len(g.Players[nextIdx].Spoils) >= 5},
						}
					} else {
						g.Phase = Phase{
							Deploy: &DeployPhase{
								Reinforcements: g.Players[nextIdx].Reinforcements,
							},
						}
					}
					return
				}
			}
		}
	}
}

func (g *GameState) ApplyAction(m *Map, action *Action) ([]*Event, error) {
	if g.Phase.Spoils != nil {
		return g.applySpoilsAction(action.Spoils)
	} else if g.Phase.Deploy != nil {
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
		if action.JoinGame != nil {
			event, err := g.AddPlayer(action.JoinGame.Player)
			if err != nil {
				return nil, err
			}
			return []*Event{event}, nil
		} else if action.StartGame != nil {
			if g.Players[0].Name != action.StartGame.Player {
				return nil, fmt.Errorf("only admin can start the game")
			}
			event, err := g.Start(m)
			if err != nil {
				return nil, err
			}
			return []*Event{event}, nil
		} else {
			return nil, fmt.Errorf("game has not started")
		}
	} else {
		panic("invalid game phase")
	}
}

func (g *GameState) applySpoilsAction(spoils *SpoilsAction) ([]*Event, error) {
	if spoils == nil {
		return nil, fmt.Errorf("action does not apply to 'spoils' phase")
	}
	if g.ActivePlayer != spoils.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	player := g.findPlayer(spoils.Player)
	if len(spoils.Spoils) == 0 && !g.Phase.Spoils.Mandatory {
		// Skipping spoils.
		oldPhase := g.Phase
		g.Phase = Phase{Deploy: &DeployPhase{Reinforcements: player.Reinforcements}}
		return []*Event{
			{
				PhaseChanged: &PhaseChangedEvent{
					OldPlayer: g.ActivePlayer,
					NewPlayer: g.ActivePlayer,
					OldPhase:  oldPhase,
					NewPhase:  g.Phase,
				},
			},
		}, nil
	}

	if len(spoils.Spoils) != 3 {
		return nil, fmt.Errorf("must play 3 spoils")
	}

	red := 0
	green := 0
	blue := 0
	keep := []*Spoil{}
	cash := []*Spoil{}
	for i := range player.Spoils {
		spoil := player.Spoils[i]
		found := false
		for j := range spoils.Spoils {
			if spoil.Name == spoils.Spoils[j] {
				found = true
				cash = append(cash, spoil)
				switch spoil.Color {
				case "red":
					red += 1
				case "green":
					green += 1
				case "blue":
					blue += 1
				}
				break
			}
		}
		if !found {
			keep = append(keep, spoil)
		}
	}

	var bonus uint64
	if red == 3 {
		bonus = 4
	} else if green == 3 {
		bonus = 6
	} else if blue == 3 {
		bonus = 8
	} else if red == 1 && green == 1 && blue == 1 {
		bonus = 10
	} else {
		return nil, fmt.Errorf("invalid spoils")
	}

	deployments := make(map[string]uint64)
	player.Spoils = keep
	for _, spoil := range cash {
		territ := g.Territs[spoil.Name]
		if territ.Owner == spoils.Player {
			territ.Troops += 2
			deployments[spoil.Name] = 2
		}
		g.replaceSpoil(spoil)
	}

	oldPhase := g.Phase
	g.Phase = Phase{Deploy: &DeployPhase{Reinforcements: player.Reinforcements + bonus}}
	events := []*Event{
		{
			PhaseChanged: &PhaseChangedEvent{
				OldPlayer: g.ActivePlayer,
				NewPlayer: g.ActivePlayer,
				OldPhase:  oldPhase,
				NewPhase:  g.Phase,
			},
		},
		{
			StatsChanged: g.statsUpdate(),
		},
	}

	if len(deployments) > 0 {
		events = append(events, &Event{
			Deploy: &DeployAction{
				Player:      spoils.Player,
				Deployments: deployments,
			},
		})
	}
	return events, nil
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

		oldPhase := g.Phase

		// Adjust all stats.
		if g.calculateStats(m) {
			// The game is over!
			g.Phase = Phase{GameOver: &GameOverPhase{Winner: attack.Player}}
		} else {
			// Move to the advance phase.
			g.Phase = Phase{Advance: &AdvancePhase{From: attack.From, To: attack.To}}
		}
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
	g.Phase = Phase{Reinforce: &ReinforcePhase{Conquered: g.Phase.Attack.Conquered}}
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
	g.Phase = Phase{Attack: &AttackPhase{Conquered: true}}
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
	if to.Owner != reinforce.Player {
		return nil, fmt.Errorf("territory '%s' does not belong to you", reinforce.To)
	}
	if reinforce.Troops >= from.Troops {
		return nil, fmt.Errorf("territory '%s' does not have enough troops to reinforce", reinforce.From)
	}
	if !m.IsConnected(reinforce.From, reinforce.To, reinforce.Player, g) {
		return nil, fmt.Errorf("territory '%s' is not reinforceable from '%s'", reinforce.To, reinforce.From)
	}
	to.Troops += reinforce.Troops
	from.Troops -= reinforce.Troops

	var events []*Event
	if g.Phase.Reinforce.Conquered {
		player := g.findPlayer(g.ActivePlayer)
		player.Spoils = append(player.Spoils, g.takeSpoil())
		events = append(events, &Event{StatsChanged: g.statsUpdate()})
	}

	oldPhase := g.Phase
	g.selectNextPlayer()
	events = append(events, &Event{Reinforce: reinforce},
		&Event{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: reinforce.Player,
			NewPlayer: g.ActivePlayer,
			OldPhase:  oldPhase,
			NewPhase:  g.Phase,
		},
		})
	return events, nil
}

func (g *GameState) applyEndReinforceAction(endReinforce *EndPhaseAction) ([]*Event, error) {
	if endReinforce == nil {
		return nil, fmt.Errorf("action does not apply to 'reinforce' phase")
	}
	if g.ActivePlayer != endReinforce.Player {
		return nil, fmt.Errorf("it is not your turn")
	}
	var events []*Event
	if g.Phase.Reinforce.Conquered {
		player := g.findPlayer(g.ActivePlayer)
		player.Spoils = append(player.Spoils, g.takeSpoil())
		events = append(events, &Event{StatsChanged: g.statsUpdate()})
	}
	oldPhase := g.Phase
	g.selectNextPlayer()
	events = append(events,
		&Event{PhaseChanged: &PhaseChangedEvent{
			OldPlayer: endReinforce.Player,
			NewPlayer: g.ActivePlayer,
			OldPhase:  oldPhase,
			NewPhase:  g.Phase,
		},
		})
	return events, nil
}

func (g *GameState) Owns(owner string, territ string) bool {
	if t, found := g.Territs[territ]; found {
		return t.Owner == owner
	}
	return false
}
