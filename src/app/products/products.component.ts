import { Component, OnInit } from '@angular/core';
import { Route } from '@angular/router';


import { Context } from 'radweb';
import { Products } from '../weekly-families-deliveries/weekly-families-deliveries';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent  {

  constructor(private context: Context) { }
  products = this.context.for(Products).gridSettings({
    allowUpdate: true,
    allowInsert: true,
    columnSettings: p => [
      p.name, { column: p.order, width: '90' }
    ],
    knowTotalRows: true,
    get: {
      orderBy: p => [p.order, p.name],
      limit: 50
    }
  });

}
 