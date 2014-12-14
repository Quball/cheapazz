var log = console.log.bind(console);
var isMobile = false;

if(typeof window.orientation !== 'undefined'){
    log('Mobile user');
    isMobile = true;
    $('.mobile-msg').show();
    $('.overlay').hide();
    $('.controlsWrapper').hide();
}

window.onload = function(){
    if(!isMobile) {
        setup();
    }
}

// Google Youtube API
var apiKey = 'AIzaSyDU1W8AVR5e9w7scogPgddEArlElYb91YY';
var scopes = 'http://www.googleapis.com/auth/plus.me';
var playLists = {
    videos: 'PLUFm8Yjelbne9X6O0-RYX3xGDu3X9e_aT', 
    music: 'PLUFm8Yjelbnf3bJAwELaIWvyg86h1Y8HD'
};

var numOfLists = function(){
    var i = 0;
    for(key in playLists) {
        i++;
    }
    return i;
}

var _video, _music;

function googleApiClientReady() {
    
    if(!isMobile) {

        gapi.client.setApiKey(apiKey);
        gapi.client.load('youtube', 'v3', function() {
            
            $.each(playLists, function(k, v) {
                request = gapi.client.youtube.playlistItems.list({
                    part: 'snippet',
                    playlistId: v,
                    maxResults: 50
                });
                request.execute(function(response) {
                    if(k == 'videos') {
                        _video = new listSetup(k, response, function(e){
                            youtubeSetup(e.type, e.list);
                        });
                    } else if(k == 'music') {
                        if(response.result.nextPageToken){
                            request = gapi.client.youtube.playlistItems.list({
                                part: 'snippet',
                                playlistId: v,
                                maxResults: 50,
                                pageToken: response.result.nextPageToken
                            });
                            request.execute(function(response) {
                                var nextPage = addToMusicList(response.items);
                                var tmpMusicList = _music.getList('music');
                                $.each(nextPage, function(k, v){
                                    tmpMusicList.push(v);
                                });
                                 _music.setList(tmpMusicList);
                            });
                        }
                        _music = new listSetup(k, response, function(e){
                            youtubeSetup(e.type, e.list);
                        });
                    }
                });  
            });
        });
    }
}

function addToMusicList(newListItems) {
    var tmpList = [];
    $.each(newListItems, function(k, v){
       tmpList.push(v.snippet.resourceId.videoId);
    });
    return tmpList;
}

// create the iframe for youtube
var tag = document.createElement('script');
tag.src = "http://youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// General site vars
var windowW = $(window).innerWidth();
var windowH = $(window).innerHeight();
var videoPlayer, musicPlayer;
var playerObj, playerSettings = [60,90], canSeek = false, canPlay = true, nextVid, getTimeInterval, currentVideo, currentTime, endTime, muted = false;
var maxQuality = 'hd720';
var overlay = $('.overlay');
var title = $('#js-title');
var vList, videolistLength, mList, musiclistLength;
var clickPause = false; 
var clickPlay = false;
var winning = false;

function youtubeSetup(type, list) {
    
    if(type == 'music') {
        
        musiclistLength =  list.length;
        
        function onMusicReady(event) {
            
            musicPlayer.setVolume(40);
            var rand = getRandom(0, musiclistLength);
            mList = _music.getList('music');
            musicPlayer.setPlaybackQuality(maxQuality);
            musicPlayer.loadVideoById(mList[rand]);
            title.html( _music.getTitle('music', rand));
        }
        
        function musicPlaybackQualityChange(event) {
            if(event.data == 'hd720' || event.data == 'hd1080' || event.data == 'large') {
                musicPlayer.setPlaybackQuality('medium');
            }
        }
        
        function onMusicStateChange(event) {
            if(event.data == 0) {
                
                var list = _music.getList('music');
                songIndex = getRandom(0, list.length);
                musicPlayer.setPlaybackQuality(maxQuality);
                musicPlayer.loadVideoById(list[songIndex]);
            }
        }
        
        function onMusicPlayerError(event) {
            log('An error with the music: ', event.data);
            var rand = getRandom(0, musiclistLength);
            musicPlayer.loadVideoById(mList[rand]);
        }
        
        musicPlayer = new YT.Player('ytplayerMusic', {
            width: 800,
            height: 600,
            videoId: '',
            allowfullscreen: 'false',
            playerVars: {
                controls: 1,
                showinfo: 0,
                rel: 0
            },
            events: {
                'onReady': onMusicReady,
                'onStateChange': onMusicStateChange,
                'onPlaybackQualityChange': musicPlaybackQualityChange,
                'onError': onMusicPlayerError
            }
        });
        
    } else if(type == 'video') {
        
        videolistLength = list.length;
        
        function onPlayerReady(event) {
            
            playerObj = $('ytplayer');
            setStyle(windowW, windowH);
            vList = _video.getList('video');
            videoPlayer.setVolume(0);
            var rand = getRandom(0, videolistLength);
            currentVideo = vList[rand];
            videoPlayer.setPlaybackQuality(maxQuality);
            canSeek = true;
            videoPlayer.loadVideoById(vList[rand]);
        }
        
        function onPlaybackQualityChange(event) {
            if(event.data == 'hd1080') {
                videoPlayer.setPlaybackQuality(maxQuality);
            }
        }
        
        function onPlayerStateChange(event) {
            
            if(winning) {
                canSeek = false; 
                videoPlayer.setVolume(0);
                musicPlayer.setVolume(40);
            }
                        
            if(event.data == 1) {
                
                if(clickPlay) { 
                    clickPlay = false; 
                    return false; 
                } else {
                    
                    if(canSeek) {
                        time = videoPlayer.getDuration();
                        startTime = getRandom(0, time);
                        videoPlayer.seekTo(startTime, true);
                        endTime = getRandom(playerSettings[0], playerSettings[1]);
                        endTime = endTime + startTime;
                        setTimeout(function(){
                            overlay.hide();
                        }, 2500);
                        
                        getTimeInterval = setInterval(function(){
                            currentTime = Math.floor(videoPlayer.getCurrentTime());
                            if(currentTime >= endTime) {
                                videoPlayer.pauseVideo();
                                clearInterval(getTimeInterval);
                            }
                        } , 500);
                        canSeek = false;
                        winning = false;          
                    } else {
                        setTimeout(function(){
                            overlay.hide();
                        }, 2500);
                        canSeek = true;
                    }
                }
            } else if(event.data == 2 || event.data == 0) {
                
                if(clickPause) { 
                    clickPause = false;
                    return false; 
                } else {
                
                    nextVid = getRandom(0, videolistLength);
                    if(nextVid == videolistLength) {
                        nextVid = 0;
                    }
                    if(canPlay) {
                        videoPlayer.setPlaybackQuality(maxQuality);
                        currentVideo = vList[nextVid];
                        videoPlayer.loadVideoById(vList[nextVid]);
                        canSeek = true;
                    }
                }
            } else if(event.data == -1 || event.data == 3) {
                overlay.show();
            }
        }
        
        function onVideoPlayerError(event) {
            log('An error with the video: ', event.data);
            nextVid = getRandom(0, videolistLength);
            currentVideo = vList[nextVid];
            videoPlayer.loadVideoById(vList[nextVid]);
            canSeek = true;
        }
        
        function setStyle(w, h) {
            playerObj.attr('width', w).attr('height', h);
        }
        
        videoPlayer = new YT.Player('ytplayer', {
            width: windowW,
            height: windowH,
            videoId: '',
            allowfullscreen: 'true',
            playerVars: {
                iv_load_policy: 3,
                controls: 1,
                showinfo: 0,
                rel: 0,
                autohide : 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onPlaybackQualityChange': onPlaybackQualityChange,
                'onError': onVideoPlayerError
            }
        });
        
        window.onresize = function(event) {
            windowW = $(window).innerWidth();
            windowH = $(window).innerHeight();
            setStyle(windowW, windowH);
        };
    }
}

function msToMin(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function getRandom(min, max) {
    var rand = Math.random() * (max - min) + min;
    return Math.floor(rand);
}
    
function listSetup(type, data, callback) {

    var total = numOfLists();
    
    if(type == 'videos') {
        
        var videoList = [];
        var videoDescList = [];
    
        $.each(data.items, function(key, val){
            videoList.push(val.snippet.resourceId.videoId);
            videoDescList.push(val.snippet.title);
            if(videoList.length == data.items.length) {
                if(typeof callback == 'function') {
                    var returnData = {'type':'video', 'list':videoList};
                    callback(returnData);
                }   
            }
        });
        
    } else {
        
        var musicList = [];
        var musicDescList = [];
        
        $.each(data.items, function(key, val){
            musicList.push(val.snippet.resourceId.videoId);
            musicDescList.push(val.snippet.title);
            if(musicList.length == data.items.length) {
                if(typeof callback == 'function') {
                    var returnData = {'type':'music', 'list':musicList};
                    callback(returnData);
                }
            }
        });
    }
    
    function setList(newList) {
        musicList = newList;
    }
    
    function getList(t) {
        if(t == 'video') {
            return videoList;
        } else if(t == 'music') {
            return musicList;
        }
        return 'List type not specified';
    }
    
    function getTitle(t, i) {
        if(t == 'video') {
            return videoDescList[i];
        } else if(t == 'music') {
            return musicDescList[i];
        }
        return 'List type or video index not found';
    }
    
    return {
        setList : function(list) {
            return setList(list);
        },
        getList : function(type) {
            return getList(type);
        },
        getTitle : function(type, index) {
            return getTitle(type, index);
        }
    }
}

// User settings controller from panel
function setup() {
    
    var toggleVideoStatus = $('#togglePlayer');
    var newVideo = $('#newVideo');
    var newSong = $('#nextSong');
    var submitBtn = $('#submit');
    
    toggleVideoStatus.on('click', function(){
        
        if(canPlay) {
            clickPause = true;
            videoPlayer.pauseVideo();
            canPlay = false;
            toggleVideoStatus.removeClass('pause');
            toggleVideoStatus.addClass('play');
        } else {
            clickPlay = true;
            videoPlayer.playVideo();
            canPlay = true;
            toggleVideoStatus.addClass('pause');
            toggleVideoStatus.removeClass('play');
        }
        
        if(muted) {
            musicPlayer.playVideo();
            muted = false;
        } else {
            musicPlayer.pauseVideo();
            muted = true;
        }
    });
    
    newVideo.on('click', function(){
        videoPlayer.pauseVideo(); 
    });
    
    newSong.on('click', function(){
        var list = _music.getList('music');
        songIndex = getRandom(0, list.length);
        /* log( _music.getTitle('music', songIndex)); */
        musicPlayer.setPlaybackQuality(maxQuality);
        musicPlayer.loadVideoById(list[songIndex]);
    });
    
    submitBtn.on('click', function(){
        if($('.submit-msg').hasClass('in')) {
            $('.submit-msg').find('p').fadeOut('fast', function(){
                $('.submit-msg').removeClass('in');    
            });
        } else {
            $('.submit-msg').addClass('in');
        }
        
        $('.submit-msg').one('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', 
        function() {
            if($(this).hasClass('in')) {
                $(this).find('p').fadeIn();
            }
        });
    });
}

function winSetup() {
    videoPlayer.loadVideoById('GGXzlRoNtHU');
    canSeek = false;
    winning = true;
    $('.overlay-winning').show();
    var h1Elem = $('.overlay-winning h1.js-winning');
    h1Elem.text('#');
    var letterList = ['w', 'i', 'n', 'n', 'i', 'n', 'g'];
    var listLength = letterList.length;
    var count = 0;
    
    var winningInterval = setInterval(function(){
        h1Elem.append(letterList[count]);
        ++count;

        if(count == listLength + 1) {
            clearInterval(winningInterval);
            musicPlayer.setVolume(0);
            videoPlayer.setVolume(100);
            videoPlayer.playVideo();
            $('.overlay-winning').fadeOut('slow');
        }
    }, 500);
}

var pressed = '';
$(document).on('keydown', function(e){
    // w = 87, i = 73, n = 78, g = 71
    var keyList = {
        87 : 'w',
        73 : 'i',
        78 : 'n',
        71 : 'g'
    };
    if(e.which == 27) { 
        pressed = '';
    }else {
    
        pressed = pressed + keyList[e.which];
        if(pressed == 'winning') {
            pressed = '';
            winSetup();
        }
    }
});

/* Fullscreen code */

// kan kun kjøre gjennom click... fullscreen(document.documentElement);
var fullscreenBtn = $('#fullScreen');

function fullscreen(element) {
    
    if(element.requestFullscreen) {
        element.requestFullscreen();
    } else if(element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if(element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if(element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

fullscreenBtn.on('click', function(){
    fullscreen(document.documentElement); 
});