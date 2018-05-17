import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class OpenMrsHttpInterceptor implements HttpInterceptor {

  constructor(){}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log("OpenMrs interceptor");

    const authToken = localStorage.getItem('authToken');

    const authReq = req.clone( {
      headers: req.headers.set('Authorization', 'Basic ' + authToken)
    });


    return next.handle(authReq);
  }

}
