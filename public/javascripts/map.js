const { GoogleAuth } = require("google-auth-library");

var myLatLng = {lat: 38.3460, lng: -0.4907};
var mapOptions = {
    center: myLatLng,
    zoom: 7,
    mapType: GoogleAuth.maps.mapTypeId.ROADMAP 
};


//Create Map

var map = new GoogleAuth.maps.Map(document.getElementById("googleMap"), mapOptions);

//Create a Directions service object to use the route method for our request

var directionsService = new GoogleAuth.maps.directionsService();

//create a directionsRenderer object which we will use to display the route

var directionsDisplay = new GoogleAuth.maps.DirectionsRenderer();

//bind the diretionsRenderer to the map

directionsDisplay.setMap(map);

//function

function calcRoute(){
    //create request
    var request = {
        origin: document.getElementById("from").ariaValueMax,
        destination: document.getElementById("to").ariaValueMax,
        travelMode: Google.maps.TravelMode.DRIVING, //walking, bycycling and transit
        unitSystem: google.maps.unitSystem.IMPERIAL
    }

    //pass the request to the route method
    directionsService.route(request, (result, status)=>{
        if(status==google.maps.DirectionsStatus.OK){

            //get distance and time
            const output = document.querySelector("#output");
            output.innerHTML = "<div class='alert-info'>From: "+ document.getElementById("from").value + "<br />To: "+ document.getElementById("to").value +". <br />Driving Distance:" + result.routes[0].legs[0].distance.text + ".<br />Duration: "+ result.routes[0].legs[0].duration.text + ". </div>";


            //display route
            directionsDisplay.setDirections(result);
        }else{
            //delete route from map
            directionsDisplay.setDirections({ routes: []});

            //center map in spain
            map.setCenter(myLatLng);

            //show error message
            output.innerHTML = "<div class='alert-danger'>Could not retrieve driving distance.</div>";
        }
    });
}


//create autocomplete objects for all input

var options = {
    types: ['(cities)']
}

var input1 = document.getElementById("from");
var autocomplete = new google.maps.places.Autocomplete(input1, options)

var input2 = document.getElementById("to");
var autocomplete = new google.maps.places.Autocomplete(input2, options)
