angular.module('services.authentication', [])
    
    .factory('authentication',
        ['Base64', '$http', '$rootScope', '$timeout', //'$cookies', 
            function (Base64, $http, $rootScope, $timeout) { //$cookies, 
                return {
                    
                    Login: function (username, password, callback) {

                        /* dummy auth */
                        $timeout(function () {
                            //var response = {success: username === 'test' && password === 'test'};
                            var response = {success: true}; //for testing
                            if (!response.success) {
                                response.message = 'Username or password is incorrect.';
                            }
                            
                            callback(response);
                        }, 1000);


                        /* TODO setup authentication check with ShipStationService/API */
                        //$http.post('/api/authenticate', { username: username, password: password })
                        //    .success(function (response) {
                        //          this.LoggedIn = true;
                        //          callback(response);
                        //    });

                    },
                    
                    SetCredentials: function (username, password) {
                        var authdata = Base64.encode(username + ':' + password);

                        $rootScope.globals = {
                            currentUser: {
                                username: username,
                                authdata: authdata
                            }
                        };

                        $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata;
                        //$cookies.put('globals', $rootScope.globals); //TODO implement cookies
                    },
                    
                    ClearCredentials: function () {
                        $rootScope.globals = {};
                        //$cookies.remove('globals');
                        $http.defaults.headers.common.Authorization = 'Basic ';
                    }
                    
                };
                
            }])
    
    
    .factory('Base64', function () {

        var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

        return {
            encode: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                do {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                        keyStr.charAt(enc1) +
                        keyStr.charAt(enc2) +
                        keyStr.charAt(enc3) +
                        keyStr.charAt(enc4);
                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";
                } while (i < input.length);

                return output;
            },

            decode: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
                var base64test = /[^A-Za-z0-9\+\/\=]/g;
                if (base64test.exec(input)) {
                    window.alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
                }
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                do {
                    enc1 = keyStr.indexOf(input.charAt(i++));
                    enc2 = keyStr.indexOf(input.charAt(i++));
                    enc3 = keyStr.indexOf(input.charAt(i++));
                    enc4 = keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";

                } while (i < input.length);

                return output;
            }
        };

    });