package main

type Map struct {
	AssetPath    string              `json:"asset_path"`
	AdjacencyMap map[string][]string `json:"adjacency_map"`
}

func (m *Map) IsAdjacent(from string, to string) bool {
	neighbours, found := m.AdjacencyMap[from]
	if !found {
		return false
	}
	for idx := range neighbours {
		if neighbours[idx] == to {
			return true
		}
	}
	return false
}

func (m *Map) IsConnected(from string, to string) bool {
	// TODO: Graph algo
	return true
}
