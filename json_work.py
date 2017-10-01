#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json

# with open('dispenser_list.json', 'rt', encoding='utf-8') as dl_f:
# 	ds = json.load(dl_f)
# 	services = set()
# 	fuel = set()
# 	for i in ds['data']:
# 		services.update([t.strip() for t in i['services'].split(',')])
# 		fuel.update([t.strip() for t in i['fuel'].split(',')])

# 	print(services, fuel)

with open('dispenser_list.json', 'rt', encoding='utf-8') as dl_f:
	ds = json.load(dl_f)
	services = set()
	fuel = set()

	def swap(s):
		if s == '':
			return []
		else:
			return [t.strip() for t in s.split(',')]
	nd = []
	for i in ds['data']:
		if len(i['services']) !=0 and len(i['fuel']) !=0:
			i['services'] = swap(i['services'])
			i['fuel'] = swap(i['fuel'])
			nd.append(i)

	with open('dispenser_list1.json', 'wt', encoding='utf-8') as dl_f:
		dl_f.write(json.dumps(nd, indent=4, ensure_ascii=False))
