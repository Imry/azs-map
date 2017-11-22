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
        data = [{header[i]:v for i, v in enumerate(d)} for d in data if len(d) == len(header)]

        def swap(s):
            if s == ' ':
                return []
            if s == '':
                return []
            else:
                return [t.strip() for t in s.split(',')]

        result = []
        for d in data:
            if 'fuel' in d:
                d['fuel'] = swap(d['fuel'])
            if 'services' in d:
                d['services'] = swap(d['services'])
            result.append(d)

        with open(fn + '.json', 'w') as f:
            json.dump(result, f, ensure_ascii=False, indent=4)

        return result

def check_prices(data):
    fuel_keys = data[0].keys() - ['type', 'lat', 'lon', 'address', 'n', 'fuel', 'region', 'dtW']
    print(fuel_keys)
    error = []
    for d in data:
        # print(d)
        presented_fuel = sorted(d['fuel'])
        presented_prices = sorted([k for k in fuel_keys if d[k] != ''])
        if presented_prices != presented_fuel:
            error.append(d)
        # else:
    with open('prices_different_fuel.csv', 'w', encoding='utf-8') as f:
        csvwriter = csv.writer(f, delimiter=';')
        for row, emp in enumerate(error):
            if row == 0:
                csvwriter.writerow(emp.keys())
            emp['fuel'] = ', '.join(emp['fuel'])
            csvwriter.writerow(emp.values())
    print(len(error))

def check_web(data):
    wf, ws, wsf = 0, 0, 0
    for d in data:
        if d['fuel'] == []:
            wf += 1
        if d['services'] == []:
            ws += 1
        if d['fuel'] == [] and d['services'] == []:
            wsf += 1
            print(d)
    print(wf, ws, wsf)

def compare_lists(web, price):
    error = []
    for p in price:
        match = False
        for w in web:
            if w['n'] == p['n']:
                match = True
                # if w['address'] != p['address']:
                #     print('"%s" "%s"'%(w['address'], p['address']))
                if w['lon'] != p['lon'] or w['lat'] != p['lat']:
                    print(w, p)
                    print('"%s, %s" "%s, %s"'%(w['lat'], w['lon'], p['lat'], p['lon']))
                break
        if not match:
            error.append(p)
            # print(p)
    print(len(error))

def merge(web, price, diff_name):
    error = []
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
                break
        if not match:
            error.append(p)
            # print(p)
    print(len(error))
    # print(error)

    with open(diff_name, 'w', encoding='utf-8') as f:
        csvwriter = csv.writer(f, delimiter=';')
        for row, emp in enumerate(error):
            if row == 0:
                csvwriter.writerow(emp.keys())
            emp['fuel'] = ', '.join(emp['fuel'])
            # emp['services'] = ', '.join(emp['services'])
            csvwriter.writerow(emp.values())

if __name__ == '__main__':
    # price = open_csv('dispenser_list_price.csv')
    price = open_csv('dispenser_list (3).csv')
    print(len(price))
    check_prices(price)

    web = open_csv('dispenser_list (2).csv')
    print(len(web))
    check_web(web)

    # compare_lists(web, price)

    merge(web, price, 'price_not_in_web.csv')
    merge(price, web, 'web_not_in_price.csv')
