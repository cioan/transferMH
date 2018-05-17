import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PatientRecord } from "../../app/patient-record";
import { Patient } from "../../app/patient";

/*
  Generated class for the OmrsRestProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class OmrsRestProvider {

  resp: any;

  constructor(public http: HttpClient) {
    console.log('Hello OmrsRestProvider Provider');
  }

  login(credentials: any) {
    return new Promise((resolve, reject) => {

      if (credentials && credentials.username) {
        let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        let base64 = btoa(credentials.username + ':' + credentials.password);
        headers.append('Authorization', 'Basic ' + base64);

        this.http.get(window.location.origin + "/session", {headers: headers} ).subscribe(res => {
          this.resp = res;
          if (this.resp.authenticated === true) {
            localStorage.setItem("authToken", JSON.stringify(base64));
          }
          resolve(res);
        }, (err) => {
          reject(err);
        });
      }

    });
  }

  getPatient(record :PatientRecord) {

    return new Promise( (resolve, reject) => {

      this.http.get(window.location.origin + "/patient/" + record.patient.uuid,
        { observe: 'response'}).subscribe(data => {

        //console.log("data.status = " + data.hasOwnProperty('status'));
        console.log("data.status = " + data.status);

        resolve(data.body);
      }, (error: any) => {
        console.log("Error retrieving patient. Error.status=" + error.status);
        reject(error.status);
      });

    });
  }


  createPatient(patient: Patient, patientUrl) {
    return new Promise( (resolve, reject) => {
        if (patientUrl) {
          resolve(patient);
        } else {
          this.http.post(window.location.origin + "/patient", patient, {observe: 'response'})
            .subscribe(response => {
              console.log(response);
              resolve(response);
            }, (error: any) => {
              console.log("Error creating patient. error.status=" + error.status);
            });
          }
    });
  }

  importEncounters(encounters: any) {
    let promises = [];
    for (let i=0; i < encounters.length; i++) {
      let encounter: any = encounters[i];
      let promise = new Promise( (resolve, reject) => {
        this.http.post( window.location.origin + "/encounter", encounter).subscribe ( response => {
          resolve(response);
        }, (error: any) => {
          console.log("error creating encounter: " + error);
        });
      });
      promises.push(promise);
    }
    return Promise.all(promises)
  }

  importVisits(visits: any) {
    let promises = [];
    for (let i=0; i < visits.length; i++) {
      console.log("visit = " + visits[i] );
      let newVisit = { ...visits[i]};
      delete newVisit.encounters;
      console.log("newVisit = " + newVisit);
      let promise = new Promise( (resolve, reject) => {
        this.http.post( window.location.origin + "/visit", newVisit).subscribe ( response => {
          resolve(response);
        }, (error: any) => {
          console.log("error creating visit: " + error);
        });
      });
      promises.push(promise);
    }
    return Promise.all(promises)
  }
}
