import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpandableRowTableService {

  constructor(private http: HttpClient) {}

  callApi(
    url: string,
    method: 'GET' | 'POST',
    payload?: any
  ): Observable<any[]> {

    if (method === 'GET') {
      return this.http.get<any[]>(url);
    }

    return this.http.post<any[]>(url, payload);
  }
}




// @Injectable({ providedIn: 'root' })
// export class ExpandableRowTableService {

//   constructor(private http: HttpClient) {}

//   callApi(
//     url: string,
//     method: 'GET' | 'POST',
//     payload: any
//   ) {
//     return method === 'POST'
//       ? this.http.post<any[]>(url, payload)
//       : this.http.get<any[]>(url);
//   }
// }
