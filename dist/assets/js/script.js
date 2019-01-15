$(function() {


/*
 * On Load
 */

	$("#search_input").focus();

	var recent = recentGet();
	if (recent !== null && recent.length > 0) {
		recent = recent.reverse();
		for(k in recent) {
			$('.recent_wrap').append('<div class="recent"><label class="query">'+recent[k]+'</label><i data-it="'+k+'" class="recent_delete"><svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></svg></i></div>');
		}
	} else {
		$('.recent_search').hide();
	}
	
/*
 * Functions
 */

	function notif(text) {$("#notif").show(); $("#notif").empty(); $("#notif").html(text); }

	function recentRemove(query) {
		let recent = JSON.parse(localStorage.getItem('recent'));
		var i = recent.indexOf(query);
		if (i != -1) {
			recent.splice(i, 1);
		}

		localStorage.setItem('recent', JSON.stringify(recent));
	}

	function recentRemoveAll() {
		let recent = [];
		localStorage.setItem('recent', JSON.stringify(recent));
	}

	function recentAdd(query) {
		if (typeof localStorage.getItem('recent') !== 'undefined' && localStorage.getItem('recent') !== null) {
			var recent = JSON.parse(localStorage.getItem('recent'));
			if (recent[recent.length-1] != query) {
				if (recent.length >= 5) {recent.pop();} // delete last one
			} else {return;}
		} else { var recent = []; }

		recent.push(query);
		localStorage.setItem('recent', JSON.stringify(recent));
	}

	function recentGet() {
		if (typeof localStorage.getItem('recent') !== 'undefined' && localStorage.getItem('recent') !== null) {
			return JSON.parse(localStorage.getItem('recent'));
		} return [];
	}


/*
 * Events
 */

 	// Clear Recent Item
	$(document).on('click', ".recent_delete", function() {
		recentRemove($(this).parent().find(".query").text());
		$(this).parent().addClass('clear');
		$(this).parent().fadeOut().delay(500);
		setTimeout(function(){
			$(this).parent().remove();
		}, 1000);
	});

	// Clear Recent All
	$(document).on('click', "#clear_recent", function() {
		$('.recent_wrap > .recent').each(function(i, item) {
			$(this).addClass('clear');
		});
		recentRemoveAll();
	});

	$(".anime .anime_cta").on('click', function() {
		chrome.tabs.create({
			'url': $(this).attr('data-url')
		});
	});

	// Search Submit
	$("#search_form").on('submit', function(e) {
		e.preventDefault();
		$("#notif").hide();

		var text = $("#search_input").val();

		if (text.length < 3) {
			notif("Search query must consist more than <b>2 letters</b>!");
			return;
		}

		recentAdd(text);
		$("#search_input").val(text);

		$(".search_results").empty();
		$(".search_results").hide();
		$(".recent_search").hide();
		$(".anime").hide();


		if (/anime:(\s|)([0-9]{1,})/.test(text)) {
			var matches = text.match(/anime:(\s|)([0-9]{1,})/);
			var id = matches[2];

			$("#overlay_loading").show();
			$("#overlay_loading").css('display', 'grid');

			$.ajax({
				url: 'https://api.jikan.moe/v3/anime/'+id,
				success: function(data) {
					$("#overlay_loading").hide();

					$(".anime").show();
					$(".anime").css('display', 'grid');

					$(".anime h1").text(data.title);
					$(".anime .id span").text(data.mal_id);
					$(".anime .source span").text(data.source);
					$(".anime .aired span").text(data.aired.string);
					$(".anime .type span").text(data.type);
					$(".anime .premiered span").text(data.premiered);
					$(".anime .broadcast span").text(data.broadcast);
					$(".anime .score span").text(data.score);
					$(".anime .rank span").text(data.rank);
					$(".anime .episodes span").text(data.episodes);
					$(".anime .rating").text(data.rating);
					$(".anime .img").attr("src", data.image_url);
					$(".anime .img").attr("alt", data.title);
					$(".anime p").html(data.synopsis).text();

					$('.anime .anime_cta').attr('data-url', 'https://myanimelist.net/anime/'+data.mal_id);


					for(k in data.genres) {
						$(".anime .genres").append("<label>"+data.genres[k].name+"</label>")
					}

					for(k in data.studios) {
						$(".anime .studios span").append("<a href=\""+data.studios[k].url+"\">"+data.studios[k].name+"</a>")
					}

					if (data.airing) {$(".anime .badge.airing").css('display', 'flex'); }

					$(".anime").addClass('fadeIn');
				}
			});
		} else {
			$("#overlay_loading").show();
			$("#overlay_loading").css('display', 'grid');
			var query = encodeURI(text);

			$.ajax({
				url: 'https://api.jikan.moe/v3/search/anime?q='+query,
				success: function(data) {
					if ('error' in data) {
						$("#overlay_loading").hide();
						if (data.error == "File does not exist") {
							notif("Anime does not exist!");
							return;
						}
						
						notif("Unknown error. Try again later.");
						return;
					}

					if (data.results === undefined || data.results.length == 0) {
						notif("No results for \""+query+"\"");
						return;
					}

					$("#overlay_loading").hide();

					$(".search_results").show();

					for(k in data.results) {
						$(".search_results").append('<div class="result"> <img  height="143px" src="'+data.results[k].image_url+'" alt="'+data.results[k].title+'"> <div class="info"> <label> <i class="icon"> <svg height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M9 11.3l3.71 2.7-1.42-4.36L15 7h-4.55L9 2.5 7.55 7H3l3.71 2.64L5.29 14z"/><path d="M0 0h18v18H0z" fill="none"/></svg> </i> <span>'+data.results[k].score+'</span></label> <label> <i class="icon"><svg height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg></i> <span>'+data.results[k].episodes+'</span></label> </div> <div class="synopsis"> <span><p>'+data.results[k].title+'<br> MAL ID : '+data.results[k].mal_id+'</p></span></div> <button class="cta_more" data-id="'+data.results[k].mal_id+'"><svg height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/><path d="M0-.25h24v24H0z" fill="none"/></svg></button> </div>');
					}

					$(".search_results").addClass('fadeIn');
				}
			});
		}
	});


	// Select Recent Item
	$(".recent > .query").on('click', function() {
		$(".search_results").empty();
		$(".search_results").hide();
		$(".recent_search").hide();
		$(".anime").hide();

		var text = $(this).text();
		recentAdd(text);
		$("#search_input").val(text);

		if (/anime:(\s|)([0-9]{1,})/.test(text)) {
			var matches = text.match(/anime:(\s|)([0-9]{1,})/);
			var id = matches[2];

			$("#overlay_loading").show();
			$("#overlay_loading").css('display', 'grid');

			$.ajax({
				url: 'https://api.jikan.moe/v3/anime/'+id,
				success: function(data) {
					$("#overlay_loading").hide();

					$(".anime").show();
					$(".anime").css('display', 'grid');

					$(".anime h1").text(data.title);
					$(".anime .id span").text(data.mal_id);
					$(".anime .source span").text(data.source);
					$(".anime .aired span").text(data.aired.string);
					$(".anime .type span").text(data.type);
					$(".anime .premiered span").text(data.premiered);
					$(".anime .broadcast span").text(data.broadcast);
					$(".anime .score span").text(data.score);
					$(".anime .rank span").text(data.rank);
					$(".anime .episodes span").text(data.episodes);
					$(".anime .rating").text(data.rating);
					$(".anime .img").attr("src", data.image_url);
					$(".anime .img").attr("alt", data.title);
					$(".anime p").html(data.synopsis).text();

					$('.anime .anime_cta').attr('data-url', 'https://myanimelist.net/anime/'+data.mal_id);

					for(k in data.genres) {
						$(".anime .genres").append("<label>"+data.genres[k].name+"</label>")
					}

					for(k in data.studios) {
						$(".anime .studios span").append("<a href=\""+data.studios[k].url+"\">"+data.studios[k].name+"</a>")
					}

					if (data.airing) {$(".anime .badge.airing").css('display', 'flex'); }

					$(".anime").addClass('fadeIn');
				}
			});
		} else {
			$("#overlay_loading").show();
			$("#overlay_loading").css('display', 'grid');
			var query = encodeURI(text);

			$.ajax({
				url: 'https://api.jikan.moe/v3/search/anime?q='+query,
				success: function(data) {
					if ('error' in data) {
						$("#overlay_loading").hide();
						if (data.error == "File does not exist") {
							notif("Anime does not exist!");
							return;
						}
						
						notif("Unknown error. Try again later.");
						return;
					}

					if (data.results === undefined || data.results.length == 0) {
						notif("No results for \""+query+"\"");
						return;
					}

					$("#overlay_loading").hide();

					$(".search_results").show();

					for(k in data.results) {
						$(".search_results").append('<div class="result"> <img  height="143px" src="'+data.results[k].image_url+'" alt="'+data.results[k].title+'"> <div class="info"> <label> <i class="icon"> <svg height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M9 11.3l3.71 2.7-1.42-4.36L15 7h-4.55L9 2.5 7.55 7H3l3.71 2.64L5.29 14z"/><path d="M0 0h18v18H0z" fill="none"/></svg> </i> <span>'+data.results[k].score+'</span></label> <label> <i class="icon"><svg height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg></i> <span>'+data.results[k].episodes+'</span></label> </div> <div class="synopsis"> <span><p>'+data.results[k].title+'<br> MAL ID : '+data.results[k].mal_id+'</p></span></div> <button class="cta_more" data-id="'+data.results[k].mal_id+'"><svg height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/><path d="M0-.25h24v24H0z" fill="none"/></svg></button> </div>');
					}

					$(".search_results").addClass('fadeIn');
				}
			});
		}
	});

	// Select Search Item
	$(document).on('click', '.cta_more', function() {
		var id = $(this).attr('data-id');

		$(".search_results").fadeOut();
		$(".search_results").empty();
		$("#overlay_loading").show();
		$("#overlay_loading").css('display', 'grid');

		$.ajax({
			url: 'https://api.jikan.moe/v3/anime/'+id,
			success: function(data) {
				$("#overlay_loading").hide();

				$(".anime").show();
				$(".anime").css('display', 'grid');

				$(".anime h1").text(data.title);
				$(".anime .id span").text(data.mal_id);
				$(".anime .source span").text(data.source);
				$(".anime .aired span").text(data.aired.string);
				$(".anime .type span").text(data.type);
				$(".anime .premiered span").text(data.premiered);
				$(".anime .broadcast span").text(data.broadcast);
				$(".anime .score").text(data.score);
				$(".anime .rank").text("#"+data.rank);
				$(".anime .episodes span").text(data.episodes);
				$(".anime .rating").text(data.rating);
				$(".anime .img").attr("src", data.image_url);
				$(".anime .img").attr("alt", data.title);
				$(".anime p").html(data.synopsis).text();

				$('.anime .anime_cta').attr('data-url', 'https://myanimelist.net/anime/'+data.mal_id);

				for(k in data.genres) {
					$(".anime .genres").append("<label>"+data.genres[k].name+"</label>")
				}

				for(k in data.studios) {
					$(".anime .studios span").append("<a href=\""+data.studios[k].url+"\">"+data.studios[k].name+"</a>")
				}
	
				if (data.airing) {$(".anime .badge.airing").css('display', 'flex'); }
	
				$(".anime").addClass('fadeIn');
			}
		});
	});

	// Input Focus Style
	$("#search_input").focus(function(){
		$("#search_form").addClass('focus');
	}).blur(function(){
		$("#search_form").removeClass('focus');
	});

});