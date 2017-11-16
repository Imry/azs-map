#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import csv


def open_csv(fn):
    with open(fn) as f:
        reader = csv.reader(f, delimiter=';', quoting=csv.QUOTE_NONE)
        rows = list(reader)
        header = rows[0]
        data = rows[1:]
        data = [{header[i]:v for i, v in enumerate(d)} for d in data]

        def swap(s):
            if s == '':
                return []
            else:
                return [t.strip() for t in s.split(',')]

        for d in data:
            if 'fuel' in d:
                d['fuel'] = swap(d['fuel'])
            if 'services' in d:
                d['services'] = swap(d['services'])

        with open(fn + '.json', 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        return data


def check_prices(data):
    fuel_keys = data[0].keys() - ['type', 'lat', 'lon', 'address', 'n', 'fuel', 'region']
    print(fuel_keys)
    error = []
    for d in data:
        presented_fuel = d['fuel']
        presented_prices = [k for k in fuel_keys if d[k] != '']
        if presented_prices != presented_fuel:
            error.append(d)
    print(len(error))

def check_web(data):
    wf, ws, wsf = 0, 0, 0
    for d in data:
        if 'fuel' not in d or d['fuel'] == ['']:
            wf += 1
        if 'services' not in d:
            ws += 1
        if 'fuel' not in d and 'services' not in d:
            wsf += 1
            print(d)
    print(wf, ws, wsf)


def compare_lists(web, price):
    error = []
    for p in price:
        match = False
        for w in web:
            # print(p, w)
            if w['n'] == p['n']:
                match = True
                # if w['address'] != p['address']:
                #     print('"%s" "%s"'%(w['address'], p['address']))
                if w['lon'] != p['lon'] or w['lat'] != p['lat']:
                    print(w)
                    print('"%s, %s" "%s, %s"'%(w['lat'], w['lon'], p['lat'], p['lon']))
                break
        if not match:
            error.append(p)
            # print(p)
    print(len(error))


def merge(web, price):
    data = []
    error = []

    fuel_keys = price[0].keys() - ['type', 'lat', 'lon', 'address', 'n', 'fuel', 'region']
    
    for p in price:
        match = False
        for w in web:
            if w['n'] == p['n']:
                match = True
                # if w['address'] != p['address']:
                #     print('"%s" "%s"'%(w['address'], p['address']))
                if w['lon'] != p['lon'] or w['lat'] != p['lat']:
                    print(w)
                    print('"%s, %s" "%s, %s"'%(w['lat'], w['lon'], p['lat'], p['lon']))
                w['price'] = [[k, float(p[k].replace(',', '.'))] for k in fuel_keys if p[k] != '']
                w['lat'] = float(w['lat'])
                w['lon'] = float(w['lon'])
                w['n'] = int(w['n'])
                w['type'] = int(w['type'])
                w['region'] = int(w['region'])
                data.append(w)
                break
        if not match:
            error.append(p)
            # print(p)
    print(len(error))
    return data

if __name__ == '__main__':
    price = open_csv('dispenser_list_price.csv')
    print(len(price))
    check_prices(price)

    web = open_csv('dispenser_list_web.csv')
    print(len(web))
    check_web(web)

    compare_lists(web, price)

    data = merge(web, price)

    with open('../scripts/dispenser_list.js', 'w', encoding='utf-8') as f:
        f.write('csv = ' + json.dumps(data, ensure_ascii=False, indent=4))
    with open('../scripts/dispenser_list.min.js', 'w', encoding='utf-8') as f:
        f.write('csv = ' + json.dumps(data, ensure_ascii=False))