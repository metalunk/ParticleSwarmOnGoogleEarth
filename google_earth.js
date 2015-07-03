/// <reference path="particle_swarm.ts"/>
var jQuery;
var GoogleEarth = (function () {
    function GoogleEarth() {
        this.ZOOM = 10000000;
    }
    /**
     * Google Earth の初期化処理
     */
    GoogleEarth.prototype.initializeEarth = function () {
        var _this = this;
        var deferred = jQuery.Deferred();
        google.earth.createInstance('map3d', function (instance) {
            _this.ge = instance;
            _this.ge.getWindow().setVisibility(true);
            deferred.resolve();
        }, function (errorCode) {
            alert("Google Earth でエラーが発生しました (errorCode : " + errorCode + ")");
        });
        return deferred.promise();
    };
    /**
     * 複数の Particle を受け取り，まとめてリクエストを送る
     * Google Elevation API は非同期処理となっているため，Promise オブジェクトを返しておき
     * 標高データの受信が完了したら Deferred オブジェクトを完了する
     * TODO : リクエストは最大 512 点だから，それを考慮する
     *
     * @param particles {ParticleSwarm.Particle[]}
     * @returns {object}
     */
    GoogleEarth.getElevations = function (particles) {
        var locations = [];
        var elevator = new google.maps.ElevationService();
        particles.forEach(function (particle) {
            locations.push(new google.maps.LatLng(particle.coordinate.latitude, particle.coordinate.longitude));
        });
        var positionalRequest = {
            'locations': locations
        };
        var deferred = jQuery.Deferred();
        elevator.getElevationForLocations(positionalRequest, function (results, status) {
            if (status === google.maps.ElevationStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    particles[i].updateElevation(results[i].elevation);
                }
            }
            else {
                console.log("Elevation service failed due to: " + status);
                console.log(particles);
            }
            deferred.resolve();
        });
        locations = null;
        elevator = null;
        positionalRequest = null;
        return deferred.promise();
    };
    /**
     * 点の移動を表す矢印（いまのところただの直線）を描画する
     *
     * @param particles {ParticleSwarm.Particle[]}
     */
    GoogleEarth.prototype.drawArrows = function (particles) {
        for (var i = 0; i < particles.length; i++) {
            var polygonPlacemark = this.ge.createPlacemark('');
            var polygon = this.ge.createPolygon('');
            polygonPlacemark.setGeometry(polygon);
            polygon.setAltitudeMode(this.ge.ALTITUDE_CLAMP_TO_SEA_FLOOR);
            var outer = this.ge.createLinearRing('');
            outer.getCoordinates().pushLatLngAlt(particles[i].previousCoordinate.latitude, particles[i].previousCoordinate.longitude, 0);
            outer.getCoordinates().pushLatLngAlt(particles[i].coordinate.latitude, particles[i].coordinate.longitude, 0);
            polygon.setOuterBoundary(outer);
            polygonPlacemark.setStyleSelector(this.ge.createStyle(''));
            var lineStyle = polygonPlacemark.getStyleSelector().getLineStyle();
            lineStyle.setWidth(2);
            lineStyle.getColor().set('9900ffff');
            this.ge.getFeatures().appendChild(polygonPlacemark);
        }
        polygonPlacemark = null;
        polygon = null;
        outer = null;
        lineStyle = null;
    };
    /**
     * @param coordinate {ParticleSwarm.Coordinate}
     */
    GoogleEarth.prototype.drawResult = function (coordinate) {
        var placemark = this.ge.createPlacemark('');
        placemark.setName("Optimal Value : " + coordinate.getElevation() + " meters.");
        var style = this.ge.createStyle(''); //create a new style
        style.getIconStyle().setScale(6.0);
        placemark.setStyleSelector(style); //apply the style to the placemark
        var point = this.ge.createPoint('');
        point.setLatitude(coordinate.latitude);
        point.setLongitude(coordinate.longitude);
        placemark.setGeometry(point);
        this.ge.getFeatures().appendChild(placemark);
        var lookAt = this.ge.createLookAt('');
        lookAt.setLatitude(coordinate.latitude);
        lookAt.setLongitude(coordinate.longitude);
        lookAt.setRange(this.ZOOM);
        this.ge.getView().setAbstractView(lookAt);
        placemark = null;
        style = null;
        point = null;
        lookAt = null;
    };
    return GoogleEarth;
})();
