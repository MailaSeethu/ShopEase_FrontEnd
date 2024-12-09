import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string, fields: string[]): any[] {
    if (!items || !searchText || !fields || fields.length === 0) {
      return items;
    }
    const lowerCaseSearchText = searchText.toLowerCase();
    return items.filter(item =>
      fields.some(field => item[field]?.toLowerCase().includes(lowerCaseSearchText))
    );
  }
}