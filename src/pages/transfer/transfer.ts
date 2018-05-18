import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';

import { PatientRecord } from "../../app/patient-record";
import { OmrsRestProvider } from '../../providers/omrs-rest/omrs-rest';

/**
 * Generated class for the TransferPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-transfer',
  templateUrl: 'transfer.html',
})
export class TransferPage {

  authResponse: any;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              public http: HttpClient,
              public omrsRest: OmrsRestProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TransferPage');
  }

  login() {
    let credentials = {
      username: 'admin',
      password: 'Admin123'
    };
    this.omrsRest.login(credentials).then((result) => {
      console.log("result = " + result);
      this.authResponse = result;
    });
  }


  updateRecordEncounters(patientRecord: any, visits: any) {

    for (let i =0; i<  visits.length; i++) {
      let visit : any;
      visit = visits[i];
      for (let j =0; j <  patientRecord.visits.length; j++) {
        let srcVisit : any;
        srcVisit = patientRecord.visits[j];
        if ( visit.startDatetime == srcVisit.startDatetime
          && visit.stopDatetime == srcVisit.stopDatetime) {
          // the same visit
          // updateVisitEncounters(patientRecord.encounters, srcVisit.encounters, visit.uuid);
          for (let p = 0; p < srcVisit.encounters.length; p++) {
            let visitEncounter: any = srcVisit.encounters[p];

            for (let q = 0; q < patientRecord.encounters.length; q++) {
              let patientEncounter: any = patientRecord.encounters[q];

              if (patientEncounter.uuid == visitEncounter.uuid) {
                // add the newly created Visit UUID to the encounter
                patientEncounter.visit = {
                  uuid: visit.uuid
                };

                break;
                //patientRecord.encounters[q] = newEncounter;
              }
            }
          }
          break; //we found the visit
        }
      }
    }

    return  patientRecord.encounters;
  }

  cleanEncountersUuid(encounters: any) {
    for (let i = 0; i < encounters.length; i++) {
      let encounter = encounters[i];
      if (encounter.uuid) {
        delete encounter.uuid;
        //encounters[i] = encounter;
      }
    }
    return encounters;
  }

  importEncountersJson() {
    this.http.get<any>('assets/2_visits_encounters.json').subscribe( (response) => {

      let updatedEncounters = this.updateRecordEncounters(response, response.newVisits);
      console.log("updatedEncounters = " + updatedEncounters);
      let newEncounters = this.cleanEncountersUuid(updatedEncounters);
      console.log("newEncounters = " + newEncounters);

      this.omrsRest.importEncounters(newEncounters).then( result => {
        console.log("imported encounters: " + result);

      }, (error: any) => {
        console.log("error importing encounters: " + error);
      });
    });
  }

  importJson() {
    this.http
      .get<PatientRecord[]>('assets/4_patient.json')
      .subscribe((response) => {
        response as PatientRecord[];

        console.log("response.length = " + response.length);
        for (let i = 0; i < response.length; i++) {

          let patientRecord = { ...response[i]};
          let patientUrl: string;
          this.omrsRest.getPatient(patientRecord).then(result => {
            console.log("getPatient result = " + result);
            let patient: any;
            patient = result;
            if (patient.uuid && patient.uuid === patientRecord.patient.uuid) {
              // patient already exists
              console.log("patient already exists, uuid = " + patient.uuid);
              patientUrl = patient.uuid;
            }

          }, (error: any) => {
            console.log("error = " + error);
            if (error == '404') {
              // patient not found, create patient
              console.log("patient does not exist, error = " + error);
              patientUrl = null;
            }
          }).then( val => {
            console.log("patientUrl = " + patientUrl);

            // create new patient record
            this.omrsRest.createPatient(patientRecord.patient, patientUrl).then( result => {
              let newPatient : any;
              newPatient = result;
              console.log("newPatient.status = " + newPatient.status);
             

              this.omrsRest.importVisits(patientRecord.visits).then( result => {
                console.log("imported visits: " + result);
                // update encounters with the new visit uuid
                let encounters = this.updateRecordEncounters(patientRecord, result);
                console.log("encounters : " + encounters);
                let newEncounters = this.cleanEncountersUuid(encounters);
                console.log("newEncounters = " + newEncounters);

                this.omrsRest.importEncounters(newEncounters).then( result => {
                  console.log("imported encounters: " + result);

                }, (error: any) => {
                  console.log("error importing encounters: " + error);
                });

              }, (error: any) => {
                console.log("error importing visits: " + error);
              });


            }, (error: any) => {
              console.log("failed to create new patient, error = " + error);
            })

          });
        }
      });
  } //importJson

}
