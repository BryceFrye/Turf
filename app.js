$(function(){
  
  window.GameView = Backbone.View.extend({
    loginTemplate: _.template($('#login-template').html()),
    profileTemplate: _.template($('#profile-template').html()),
    photoTemplate: _.template($('#photo-template').html()),
    
    initialize: function() {
      _.bindAll(this, 'render');
      this.render();
    },   
    render: function() {
      if (window.location.hash.length == 0) {
         $("#login").append(this.loginTemplate());
      } else {
         this.getUser();
      }
      return this;
    },
    getUser: function() {
      var self = this;
      this.user = new User();
      this.user.fetch({success: function(model, response){
        console.log(model);
        self.currentUserId = model.id;
        self.getUserPhotos();
      }});
    },
    getUserPhotos: function() {
      var self = this;
      this.userPhotosLatLng = new Array;
      this.userPhotos = new UserPhotos();
      this.userPhotos.fetch({success: function(model, response){
        model.forEach(function(photo){
          if ( photo.has('location') ) {
            console.log(photo.get('location').latitude + ", " + photo.get('location').longitude);
            userPhoto = new Object;
            userPhoto.lat = photo.get('location').latitude;
            userPhoto.lng = photo.get('location').longitude;
            userPhoto.likes = photo.get('likes').count;
            self.userPhotosLatLng.push(userPhoto);
          }
        });
        self.userPhotosLatLng.forEach(function(photo){
          if (_.isNaN(photo.lat)){
            self.userPhotosLatLng = _.without(self.userPhotosLatLng, photo);
          }
        });
        self.plotPhotos();
        console.log(self.userPhotosLatLng);
      }});
    },
    plotPhotos: function() {
      var self = this;
      this.photos = new Photos();
      this.photos.fetch({success: function(model, response){
        console.log(model);
        //var turf = {};
        var myOptions = {
          zoom: 2,
          center: new google.maps.LatLng(30, 0),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        self.map = new google.maps.Map(document.getElementById('map_canvas'),
          myOptions);
        self.photos.forEach(function(photo){
          if ( photo.has('location') ) {
            //console.log(photo.get('location').latitude + ", " + photo.get('location').longitude);
            //$("#photo").append(self.photoTemplate({photo: photo}));       
            var content = 'Photographer: ' + photo.get('user').username + '<br />' +
                          'Likes: ' + photo.get('likes').count + '<br />' +
                          'Turf: ' + Math.floor((3.1459 * ((photo.get('likes').count * 500) * (photo.get('likes').count * 500))) / 2589988.1) + ' square miles.<br />' +
                          '<img src=' + photo.get('images').thumbnail.url + ' />';
            var infowindow = new google.maps.InfoWindow({
              content: content
            });
            var marker = new google.maps.Marker({
              position: new google.maps.LatLng(photo.get('location').latitude, photo.get('location').longitude),
              map: self.map,
              title: photo.get('id')
            });
            //turf[photo.get('id')] = {
              //center: new google.maps.LatLng(photo.get('location').latitude, photo.get('location').longitude),
              //likes: photo.get('likes').count
            //}
            google.maps.event.addListener(marker, 'dblclick', function() {
              infowindow.open(self.map, marker);
            });
            google.maps.event.addListener(marker, 'click', function() {
              console.log(marker);
              self.photos.forEach(function(photo){
                if ( photo.get('id') == marker.title ) {
                  self.selectedPhoto = photo;
                }
              });
              var photosClone = _.clone(self.photos);
              distances = new Array;
              photosClone.forEach(function(photo){
                if ( photo.get('id') == marker.title ) {
                  photosClone = _.without(photosClone, photo);
                } else {
                  if ( photo.has('location') ) {
                    var from = new google.maps.LatLng(self.selectedPhoto.get('location').latitude, self.selectedPhoto.get('location').longitude);
                    var to   = new google.maps.LatLng(photo.get('location').latitude, photo.get('location').longitude);
                    dist = new Object;
                    dist.apart = google.maps.geometry.spherical.computeDistanceBetween(from, to);
                    dist.image = photo.get('id');
                    dist.user = photo.get('user').username;
                    dist.likes = photo.get('likes').count;
                    distances.push(dist);
                  }
                }
              });
              distances.forEach(function(photo){
                if (_.isNaN(photo.apart)){
                  distances = _.without(distances, photo);
                }
              });
              var closest = _.chain(distances).sortBy(function(distance){ return distance.apart; }).value();
              closest.forEach(function(photo){
                if ( photo.likes < self.selectedPhoto.get('likes').count ) {
                  closest = _.without(closest, photo);
                }
              });
              var turf = {};
              turf[self.selectedPhoto] = {
                center: new google.maps.LatLng(photo.get('location').latitude, photo.get('location').longitude),
                likes: photo.get('likes').count
              }
              console.log(closest);
              if ( closest[0] != null){
                if ( closest[0].apart < 2000000 ) {
                  var theirTurf = closest[0].apart;
                } else {
                  var theirTurf = 2000000;
                }
              } else {
                var theirTurf = 2000000;
              }
              var turfCircle;
              for (var picture in turf) {
                var turfOptions = {
                  strokeColor: "#FF0000",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: "#FF0000",
                  fillOpacity: 0.15,
                  map: self.map,
                  center: turf[picture].center,
                  radius: theirTurf
                };
                turfCircle = new google.maps.Circle(turfOptions);
              }//for (var picture in turf) {
            });//google.maps.event.addListener(marker, 'click', function() {
          }//if ( photo.has('location') ) {
        });//self.photos.forEach(function(photo){
        self.plotUserPhotos();
      }});//this.photos.fetch({success: function(model, response){
    },
    plotUserPhotos: function() {
      var self = this;
      var turf = {};
      this.userPhotos.forEach(function(photo){
        if ( photo.has('location') ) {
          console.log(photo.get('location').latitude + ", " + photo.get('location').longitude);
//todo: move this to after the distance is checked
          var content = 'Photographer: ' + photo.get('user').username + '<br />' +
                        'Likes: ' + photo.get('likes').count + '<br />' +
                        'Turf: ' + Math.floor((3.1459 * (self.yourTurf * self.yourTurf)) / 2589988.1) + ' square miles.<br />' +
                        '<img src=' + photo.get('images').thumbnail.url + ' />';
          var infowindow = new google.maps.InfoWindow({
            content: content
          });     
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(photo.get('location').latitude, photo.get('location').longitude),
            map: self.map
          });
          turf[photo.get('id')] = {
            center: new google.maps.LatLng(photo.get('location').latitude, photo.get('location').longitude),
            likes: photo.get('likes').count
          }
          google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(self.map, marker);
          });
        }
      });
      self.checkDistance();
      var turfCircle;
      for (var picture in turf) {
        var turfOptions = {
          strokeColor: "#20B2AA",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#20B2AA",
          fillOpacity: 0.20,
          map: self.map,
          center: turf[picture].center,
          radius: self.yourTurf
        };
        turfCircle = new google.maps.Circle(turfOptions);
      }
      console.log("Your turf: " + Math.floor((3.1459 * (self.yourTurf * self.yourTurf)) / 2589988.1) + " square miles.");
    },
    checkDistance: function() {
      var self = this;
      this.distances = new Array;
      this.photos.forEach(function(photo){
        if ( photo.get('user').id == self.currentUserId ) {
          self.photos = _.without(self.photos, photo);
        } else {
          if ( photo.has('location') ) {
            var from = new google.maps.LatLng(self.userPhotosLatLng[0].lat, self.userPhotosLatLng[0].lng);
            var to   = new google.maps.LatLng(photo.get('location').latitude, photo.get('location').longitude);
            dist = new Object;
            dist.apart = google.maps.geometry.spherical.computeDistanceBetween(from, to);
            dist.image = photo.get('id');
            dist.user = photo.get('user').username;
            dist.likes = photo.get('likes').count;
            self.distances.push(dist);
          }
        }
      });
      this.distances.forEach(function(photo){
        if (_.isNaN(photo.apart)){
          self.distances = _.without(self.distances, photo);
        }
      });
      var closest = _.chain(this.distances).sortBy(function(distance){ return distance.apart; }).value();
      closest.forEach(function(photo){
        if ( photo.likes < self.userPhotosLatLng[0].likes ) {
          closest = _.without(closest, photo);
        }
      });
      if ( closest[0] != null){
        this.yourTurf = closest[0].apart;
      } else {
        this.yourTurf = 2500000;
      }
    }
  });
  
  window.User = Backbone.Model.extend({
    initialize: function() {
      this.token = window.location.hash.slice(1,99);  
    },
    url: function() {
      return 'https://api.instagram.com/v1/users/self?'+this.token+'&callback=?';
    },
    parse: function(response) {
      return response.data;
    }
  });
  
  window.UserPhotos = Backbone.Collection.extend({
    initialize: function() {
      this.token = window.location.hash.slice(1,99);  
    },
    url: function() {
      return 'https://api.instagram.com/v1/users/self/media/recent?'+this.token+'&callback=?';
      //return 'https://api.instagram.com/v1/users/self/feed?'+this.token+'&callback=?&count=30';
      //return 'https://api.instagram.com/v1/media/popular?'+this.token+'&callback=?&count=100';
    },
    parse: function(response) {
      return response.data;
    }
  });
  
  window.Photos = Backbone.Collection.extend({
    initialize: function() {
      this.token = window.location.hash.slice(1,99);  
    },
    url: function() {
      //return 'https://api.instagram.com/v1/users/self/media/recent?'+this.token+'&callback=?';
      //return 'https://api.instagram.com/v1/users/self/feed?'+this.token+'&callback=?&count=100';
      return 'https://api.instagram.com/v1/media/popular?'+this.token+'&callback=?&count=100';
    },
    parse: function(response) {
      return response.data;
    }
  });
  
  window.App = new GameView;
  
});