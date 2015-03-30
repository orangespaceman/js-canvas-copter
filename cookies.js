/*
 * Cookie Functions
 * authored/compiled by pete goodman
 */

var cookie = {

        /*
         * set cookie
         *
         * @param string name the name of the new cookie
         * @param string value the value of the new cookie
         * @param integer expires the number of days in which the cookie should expire - if not set, cookies will be session cookies only
         * @param path string the local path of the page that the cookie relates to
         * @param domain string the domain the cookie is being set from
         * @param secure boolean whether the cookie should only be available for https
         *
         */
                set : function( name, value, expires, path, domain, secure ) {

                    var today = new Date();
                    today.setTime( today.getTime() );

                    if ( expires ) {
                        expires = expires * 1000 * 60 * 60 * 24;
                    }

                    var expires_date = new Date( today.getTime() + (expires) );
                    document.cookie = name+"="+escape( value ) +
                        ( ( expires ) ? ";expires="+expires_date.toGMTString() : "" ) +
                        ( ( path ) ? ";path=" + path : "" ) +
                        ( ( domain ) ? ";domain=" + domain : "" ) +
                        ( ( secure ) ? ";secure" : "" );
                },




        /*
         * get cookie
         *
         * @param string name the name of the desired cookie
         *
         * @return string unescape the value of the desired cookie
         *
         */
                get : function( name ) {

                    var start = document.cookie.indexOf( name + "=" );
                    var len = start + name.length + 1;

                    if ( ( !start ) && ( name != document.cookie.substring( 0, name.length ) ) ) {
                        return null;
                    }

                    if ( start == -1 ) return null;
                    var end = document.cookie.indexOf( ";", len );

                    if ( end == -1 ) end = document.cookie.length;

                    return unescape( document.cookie.substring( len, end ) );
                },


        /*
         * get all cookies
         *
         * @return object cookies all current cookies
         *
         */
                getAll : function( ) {

                    //start the associative array to return
                    var cookies = { };

                    //temporary holders for each cookie name and value
                    var name, value;

                    //values to work out how far through the cookie string the function has got
                    var beginning = 0;
                    var middle, end;

                    //cycle through the cookie string
                    while (beginning < document.cookie.length) {

                        //extract the cookie content between each = and ;
                        middle = document.cookie.indexOf('=', beginning);
                        end = document.cookie.indexOf(';', beginning);

                        //if no ; is found, its the last cookie in the string
                        if (end == -1) {
                            end = document.cookie.length;
                        }

                        //if no = is found then set the name, and value to empty
                        if ( (middle > end) || (middle == -1) ) {
                            name = document.cookie.substring(beginning, end);
                            value="";

                        //everything is good, set the values
                        } else {
                            name = document.cookie.substring(beginning, middle);
                            value = document.cookie.substring(middle+1, end);
                        }

                        //add the current cookie to the associative array
                        cookies[name] = unescape(value);

                        //set the start point for the next cookie
                        beginning = end + 2;
                    }

                    //at the end of the loop, return the associative array
                    return cookies;

                },




        /*
         * remove cookie
         *
         * @param string name the name of the cookie to remove
         * @param path
         * @param string domain
         *
         */
                remove : function( name, path, domain ) {

                    if ( this.get( name ) ) document.cookie = name + "=" +
                            ( ( path ) ? ";path=" + path : "") +
                            ( ( domain ) ? ";domain=" + domain : "" ) +
                            ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
                },



        /*
         * remove  all cookies
         *
         */
                removeAll : function( ) {

                    //temporary holder for each cookie name
                    var name;

                    //values to work out how far through the cookie string the function has got
                    var beginning = 0;

                    //cycle through the cookie string
                    while (beginning < document.cookie.length) {

                        //extract the cookie content between each = and ;
                        var middle = document.cookie.indexOf('=', beginning);

                        //if no ; is found, its the last cookie in the string
                        if (middle == -1) {
                            middle = document.cookie.length;
                        } else {
                            name = document.cookie.substring(beginning, middle);
                        }

                        //remove the cookie
                        this.remove(name);

                        //since the cookie string has changed, start the loop again
                        beginning = 0;
                    }
                },


        /*
         * count cookies
         */
                count : function() {
                    var count = 0;
                    var beginning = 0;

                    //loop through cookies
                    while (beginning < document.cookie.length) {

                        //check for each = within a cookie
                        var middle = document.cookie.indexOf('=', beginning);

                        //if no = are found, end the script
                        if ( middle == -1) {
                            middle = document.cookie.length;

                        //else, an = has been found, add one to the count
                        } else {
                            count ++;
                        }

                        //start again from the last point that an = was found
                        beginning = middle + 2;
                    }

                    //return the count
                    return count;
                }
}