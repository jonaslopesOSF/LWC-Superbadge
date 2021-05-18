import { LightningElement, api, track, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getBoatsByLocation from "@salesforce/apex/BoatDataService.getBoatsByLocation";

const LABEL_YOU_ARE_HERE = "You are here!";
const ICON_STANDARD_USER = "standard:user";
const ERROR_TITLE = "Error loading Boats Near Me";
const ERROR_VARIANT = "error";

export default class BoatsNearMe extends LightningElement {
  @api boatTypeId;
  @track mapMarkers = [];
  @track isLoading = true;
  @track isRendered = false;
  latitude;
  longitude;

  @track selectedMarkerValue = LABEL_YOU_ARE_HERE;
  makersTitle = "Boats Near Me";

  // Controls the isRendered property
  // Calls getLocationFromBrowser()
  renderedCallback() {
    if (!this.isRendered) {
      this.getLocationFromBrowser();
    }
    this.isRendered = true;
  }

  // Gets the location from the Browser
  // position => {latitude and longitude}
  getLocationFromBrowser() {
    const options = {
      enableHighAccuracy: true,
      timeout: 500,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
      },
      (error) =>
        this.showToastMessage(ERROR_TITLE, error.body.message, ERROR_VARIANT),
      options
    );
  }

  showToastMessage(title, message, variant) {
    const toastEvent = new ShowToastEvent({
      title,
      message,
      variant
    });

    this.dispatchEvent(toastEvent);
  }

  handleMarkerSelect(event) {
    this.selectedMarkerValue = event.target.selectedMarkerValue;
  }

  // Add the wired method from the Apex Class
  // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
  // Handle the result and calls createMapMarkers
  @wire(getBoatsByLocation, {
    latitude: "$latitude",
    longitude: "$longitude",
    boatTypeId: "$boatTypeId"
  })
  wiredBoatsJSON({ error, data }) {
    if (data) {
      console.log('data', data);
      const boatData = JSON.parse(data);
      console.log('boatData', data);
      this.createMapMarkers(boatData);
    } else if (error) {
      const evt = new ShowToastEvent({
        title: ERROR_TITLE,
        variant: ERROR_VARIANT
      });
      this.dispatchEvent(evt);

      //this.showToastMessage(ERROR_TITLE, error.body.message, ERROR_VARIANT);
    }
    this.isLoading = false;
  }

  // Creates the map markers
  createMapMarkers(boatData) {
    // const newMarkers = boatData.map(boat => {...});
    let newMarkers = this.mappingBoatData(boatData);
    newMarkers.unshift(this.addingFirstElementToMapMarkers());
    this.mapMarkers = newMarkers;
    console.log('mapMarkers', this.mapMarkers);
  }

  mappingBoatData(boatData) {
    return boatData.map((boat) => {
      return {
        location: {
          Latitude: boat.Geolocation__Latitude__s,
          Longitude: boat.Geolocation__Longitude__s
        },
        title: boat.Name,
        value: boat.Name
      };
    });
  }

  addingFirstElementToMapMarkers() {
    return {
      location: {
        Latitude: this.latitude,
        Longitude: this.longitude
      },
      title: LABEL_YOU_ARE_HERE,
      value: LABEL_YOU_ARE_HERE,
      icon: ICON_STANDARD_USER
    };
  }
}
