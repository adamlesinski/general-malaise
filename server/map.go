package main

type Map struct {
	AssetPath string                `json:"asset_path"`
	Territs   map[string]*Territory `json:"territs"`
	Regions   map[string]*Region    `json:"regions"`
}

type Territory struct {
	Neighbours []string `json:"neighbours"`
	Center     string   `json:"center"`
	Paths      []string `json:"paths"`
	Color      string   `json:"color"`
}

type Region struct {
	Territs []string `json:"territs"`
	Color   string   `json:"color"`
	Bonus   uint64   `json:"bonus"`
}

func (m *Map) IsAdjacent(from string, to string) bool {
	territ, found := m.Territs[from]
	if !found {
		return false
	}
	for idx := range territ.Neighbours {
		if territ.Neighbours[idx] == to {
			return true
		}
	}
	return false
}

func (m *Map) IsConnected(from string, to string) bool {
	// TODO: Graph algo
	return true
}
