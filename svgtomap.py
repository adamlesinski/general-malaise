#!/usr/bin/env python3

import xml.etree.ElementTree as ET
import sys

tree = ET.parse(sys.stdin)
root = tree.getroot()

def sanitize_name(name):
    if name.endswith('_1_'):
        name = name[:-3]
    return name.replace('_', ' ')


for p in root.findall('{http://www.w3.org/2000/svg}path'):
    name = sanitize_name(p.attrib['id'])
    print('"{}": {{'.format(name))
    print('    Neighbours: []string{},')
    print('    Center: "0 0",')
    print('    Paths: []string{')
    print('        "{}",'.format(p.attrib['d'].replace(' ', '')))
    print('    },')
    print('},')

for g in root.findall('{http://www.w3.org/2000/svg}g'):
    name = sanitize_name(g.attrib['id'])
    print('"{}": {{'.format(name))
    print('    Neighbours: []string{},')
    print('    Center: "0 0",')
    print('    Paths: []string{')
    for p in g.findall('{http://www.w3.org/2000/svg}path'):
        print('        "{}",'.format(p.attrib['d'].replace(' ', '')))
    print('    },')
    print('},')
