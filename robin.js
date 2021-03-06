dojo.require('dojo.io.script');
dojo.require('dojo.behavior');
dojo.require('dojo.date');
dojo.require("dojo.date.stamp");

dojo.addOnLoad(function() {
  dojo.behavior.add({
    '#usernameForm': {
      onsubmit: function(evt) {
        evt.preventDefault();
        dojo.byId('output').innerHTML = '';
        var form = evt.target;
        var user = form.user.value;
        // Add the user to the URL hash
        window.location = window.location.href.split('#')[0] + '#' + user;
        mashup(user);
      }
    },
    '#user': {
      onfocus: function(evt) {
        if (evt.target.value == 'Enter your last.fm username') {
          evt.target.value = '';
        }
      },
      onblur: function(evt) {
        if (evt.target.value.replace(/^\s+|\s+$/g, '') == '') {
          evt.target.value = 'Enter your last.fm username';
        }
      }
    }
  });

  // Slurp in the user from the URL hash and show recent tracks
  var matches = window.location.href.match(/#(.*)/);
  if (matches && matches.length > 1) {
    var user = matches[1];
    dojo.byId('user').value = user;
    mashup(user);
  }
});

var timeoutMessage = '<div class="warning">Something funky has happened, you may wish to try again in a few minutes.<p>If the problem persists you can contact me on twitter, <a href="http://twitter.com/rapaul" target="_blank">@rapaul</a>.</p></div>';

function mashup(user){
  fadeIn('loading');
  fadeOut('output');
  dojo.io.script.get({
    callbackParamName: 'callback',
    url: 'http://ws.audioscrobbler.com/2.0/',
    content: {
      method: 'user.getrecenttracks',
      format: 'json',
      api_key: 'api_key',
      user: user,
      limit: 5
    },
    timeout: 20000,
    load: function(response) {
      var output = dojo.byId('output');
      var loading = dojo.byId('loading');

      output.innerHTML = '';
      if (response['error']) {
        output.innerHTML = response.message;
        return;
      }
      var tracks = response.recenttracks.track;
      if (tracks.length == 0) {
        output.innerHTML = 'No recent tracks, get scrobbling!';
      }
      for (var i in tracks) {
        var track = tracks[i];
        var trackDiv = build('div', { 'class': 'track' });
        trackDiv.appendChild(build('img', { 'src': track.image[2]['#text'] }));
        var trackSummary = build('div');
        var artistName = track.artist['#text'];
        var artistUrl = 'http://last.fm/music/' + encodeURI(artistName) + '/';
        var trackUrl = artistUrl + '_/' + encodeURI(track.name);
        trackSummary.appendChild(build('a', { 'href': artistUrl, 'target': '_blank', 'innerHTML': artistName }));
        trackSummary.appendChild(build('span', { 'innerHTML': ' - ' }));
        trackSummary.appendChild(build('a', { 'href': trackUrl, 'target': '_blank', 'innerHTML': track.name }));
        var formattedTime = howLongAgo(new Date(track['date'].uts * 1000));
        trackSummary.appendChild(build('span', { 'class': 'time', 'innerHTML': formattedTime }));
        trackDiv.appendChild(trackSummary);
        var tweets = build('div', { 'class': 'tweets' });
        tweets.innerHTML = '<i>Fetching latest tweets...</i>';
        trackDiv.appendChild(tweets);
        dojo.byId('output').appendChild(trackDiv);
        getTweets(artistName, track.name, tweets);
      }
      fadeOut('loading');
      fadeIn('output');
    },
    error: function(response) {
      dojo.byId('output').innerHTML = timeoutMessage;
    }
  });
}

function getTweets(artist, track, containingDiv) {
  dojo.io.script.get({
    callbackParamName: 'callback',
    url: 'http://search.twitter.com/search.json',
    content: {
      q: artist + ' ' + track,
      rpp: '5' // Show 5 tweets
    },
    timeout: 20000,
    load: function(response) {
      containingDiv.innerHTML = '';
      if (response.results.length == 0) {
        containingDiv.innerHTML = 'No tweets... perhaps you should start the conversation.';
      } else {
        for (var i in response.results) {
          var result = response.results[i];
          var div = build('div', { 'class': 'tweet' });
          var img = build('img', { 'src': result.profile_image_url });
          var user = build('a', {
            'href': 'http://twitter.com/' + result.from_user,
            'target': '_blank',
            'innerHTML': result.from_user });
          var text = build('span', { 'innerHTML': ': ' + result.text });
          var time = new Date(result.created_at);
          var formattedTime = build('span', { 'class': 'time', 'innerHTML': howLongAgo(time) });
          div.appendChild(img);
          div.appendChild(user);
          div.appendChild(text);
          div.appendChild(formattedTime);
          div.appendChild(document.createElement('p'));
          containingDiv.appendChild(div);
        }
      }
    },
    error: function(response) {
      containingDiv.innerHTML = timeoutMessage;
    }
  });
}

/*
 * Create a element of the give type with the given attributes
 */
function build(elementType, attributes) {
  return dojo.query(document.createElement(elementType)).attr(attributes)[0];
}

function fadeOut(node) {
  dojo.fadeOut({
    node:node,
    onEnd: function() {
      dojo.style(node, 'display', 'none');
    }
  }).play();
}

function fadeIn(node) {
  dojo.style(node, {'display': 'block'});
  dojo.fadeIn({node: node}).play();
}

/*
 * Time ago in words
 * Yoinked from: http://www.oreillynet.com/onlamp/blog/2008/08/dojo_goodness_part_10_its_a_do_1.html
 */
function howLongAgo(date) {
  var _now = new Date();

  var _secsAgo  = dojo.date.difference(date, _now, "second");
  var _minsAgo  = dojo.date.difference(date, _now, "minute");
  var _hoursAgo = dojo.date.difference(date, _now, "hour");
  var _daysAgo  = dojo.date.difference(date, _now, "day");

  if (_daysAgo) {
    var _howLongAgo = _daysAgo + " day";
  } else if (_hoursAgo) {
    var _howLongAgo = _hoursAgo + " hour";
  } else if (_minsAgo) {
    var _howLongAgo = _minsAgo + " min";
  } else if (_secsAgo) {
    var _howLongAgo = _secsAgo + " sec";
  } else {
    throw Error("unable to compute _howLongAgo ?!?");
  }
  return _howLongAgo.split(" ")[0] > 1 ? _howLongAgo+"s ago" : _howLongAgo+" ago";
}

