/**
 * This is the url
 */
var url = {

    // string : the url
    urlstring : null,

    // object : container for each url parameter
    params : [],


    /*
     * initialisation function
     */
            init: function() {

                // get the url string
                this.urlstring = window.location.href.split('?');

                // if there is a url string
                if (this.urlstring.length > 1) {

                    // split the url string on each ampersand
                    var urlparams = this.urlstring[1].split('&');

                    // cycle through each parameter
                    for (var i=0; i<urlparams.length; i++) {

                        // get each id and parameter
                        var split = urlparams[i].split('=');

                        // set values in array
                        url.params[i] = {};
                        url.params[i].param = split[0]
                        url.params[i].encoded = split[1];
                        url.params[i].decoded = this.decode(split[1]);
                    }
                }
            },


    /*
     * decode url string
     */
            decode: function(uri) {
                // update % values
                uri = decodeURI(uri);

                // find and replace special characters
                uri.replace (/\+/, " ");

                return uri;
            }
}