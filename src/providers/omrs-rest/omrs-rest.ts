import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PatientRecord } from "../../app/patient-record";
import { Patient } from "../../app/patient";

/*
  Generated class for the OmrsRestProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/

let VISIT_CUSTOM_REP = 'v=custom:(uuid,id,display,patient:(uuid,id),location:(uuid,id,name,display),startDatetime,stopDatetime,encounters:(uuid,id,display,encounterDatetime,encounterType:(uuid,display,name)))';

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
        console.log("getPatient data.status = " + data.status);

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
              console.log("patient created = " + response);
              resolve(response);
            }, (error: any) => {
              console.log("Error creating patient. error.status=" + error.status);
              reject(error);
            });
          }
    });
  }

  checkEncounters(encounters: any) {
    let promises = [];
    for (let i=0; i < encounters.length; i++) {
      let encounter: any = encounters[i];
      let promise = new Promise( (resolve, reject) => {
        let encounterResponse = {
          srcEncounter: encounter,
          status: null
        };
        this.http.get( window.location.origin + "/encounter/" + encounter.uuid,
          { observe: 'response'}).subscribe ( response => {
          encounterResponse.status = response.status;
          resolve(encounterResponse);
        }, (error: any) => {
          console.log("error finding encounter uuid: " + encounter.uuid);
          if (error.status) {
            encounterResponse.status = error.status;
            resolve(encounterResponse);
          }
        }, () => {
            //we are done with this http request
          console.log("complete http get:  " + JSON.stringify(encounterResponse));
        });
      });
      promises.push(promise);
    }
    return Promise.all(promises)
  }

  importEncounters(encounters: any) {
    let promises = [];
    for (let i=0; i < encounters.length; i++) {
      let encounter: any = encounters[i];
      let promise = new Promise( (resolve, reject) => {
        this.http.post( window.location.origin + "/encounter", encounter).subscribe ( response => {
          resolve(response);
        }, (error: any) => {
          console.log("failed to create encounter with  dateTime: " + encounter.encounterDatetime);
          // those are probably the registration encounters
          resolve(encounter);
        });
      });
      promises.push(promise);
    }
    return Promise.all(promises)
  }

  getPatientVisits(patientUuid: String) {
    return new Promise( (resolve, reject) => {

      this.http.get(window.location.origin + "/visit?patient=" + patientUuid + "&" + VISIT_CUSTOM_REP,
        { observe: 'response'}).subscribe(data => {

        console.log("getPatientVisits data.status = " + data.status);

        resolve(data.body);
      }, (error: any) => {
        console.log("Error retrieving patient. Error.status=" + error.status);
        reject(error.status);
      });

    });
  }

  importVisits(visits: any) {
    let promises = [];
    for (let i=0; i < visits.length; i++) {
      console.log("visit = " + visits[i] );
      let newVisit = { ...visits[i]};
      delete newVisit.encounters;
      console.log("newVisit = " + newVisit);
      let promise = new Promise( (resolve, reject) => {
        if (newVisit.uuid) {
          // only create visits that do not exist yet
          resolve(newVisit);
        } else {
          this.http.post( window.location.origin + "/visit", newVisit).subscribe ( response => {
            resolve(response);
          }, (error: any) => {
            console.log("error creating visit: " + error);
            reject(error);
          });
        }
      });
      promises.push(promise);
    }
    return Promise.all(promises)
  }
}
