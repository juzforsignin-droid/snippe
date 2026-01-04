import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExpandableRowTableService {

  constructor(private http: HttpClient) {}

  callApi(
    url: string,
    method: 'GET' | 'POST',
    payload?: any
  ): Observable<any> {

    if (method === 'GET') {
      const params = payload
        ? new HttpParams({ fromObject: payload })
        : undefined;

      return this.http.get<any>(url, { params });
    }

    return this.http.post<any>(url, payload);
  }
}
