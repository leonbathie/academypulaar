/*
    Académie française
    =========================
    developpé par Nicolas Ricklin (SDV Plurimédia)
    http://www.sdv.fr/
*/

(function ($) {

Drupal.behaviors.academieFrancaise = {
    attach: function (context, settings) {
        // Champ de recherche
        var search_form = $('#search2');
        $('#search2 .form-text').bind({
            'focus': function() {
                search_form.find('.form-submit').addClass('active');
                if ($(this).val() == 'Rechercher sur le site')
                    $(this).val('');
            },
            'blur': function() {
                search_form.find('.form-submit').removeClass('active');
                if ($(this).val() == '')
                    $(this).val('Rechercher sur le site');
            }
        });
        
        // Gestion du menu
        var items = $('#main-menu > .menu > li'),
            active_trail = $('#main-menu .active-trail'),
            active = $('#main-menu .active');
            
        items.bind({
            'mouseenter': function() {
                active_trail.each(function() { $(this).removeClass('active-trail'); });
                active.each(function() { $(this).removeClass('active'); });
            },
            'mouseleave': function() {
                active_trail.each(function() { $(this).addClass('active-trail'); });
                active.each(function() { $(this).addClass('active'); });
            }
        });
        
        // Panneaux déroulants
        $('.section').each(function() {
            if ($('.title', this).length == 0 || $('.container', this).length == 0)
                return;
            
            this.anchor = $('.title', this).first();
            this.container = $('.container', this).first();
            this.container.get(0).expanded = this.container.innerHeight();
            
            this.expand = function() {
                var section = $(this),
                    state = !(section.hasClass('expanded')),
                    expanded = this.container.get(0).expanded;
                if (state) {
                    section.addClass('expanded')
                    this.container.animate({'height': expanded}, function() {
                        $(this).css({
                            'height': 'auto',
                            'overflow': 'hidden'
                        });
                    });
                } else {
                    section.removeClass('expanded')
                    this.container.css({
                        'height': expanded,
                        'overflow': 'hidden'
                    });
                    this.container.animate({'height': 0}, 500);
                }
            }
            
            this.anchor.get(0).section = this;
            this.anchor.html(this.anchor.html() + '<span class="anchor"></span>');
            this.anchor.css('cursor', 'pointer');
            this.anchor.click(function() {
                this.section.expand();
            });
            
            if (!$(this).hasClass('expanded'))
                this.container.css({
                    'height': 0,
                    'overflow': 'hidden'
                });
        });
        
        // Champ de recherche unique
        $('.unique-search').each(function() {
            $('.form-text, .form-select', this).change(function() {
                if (!$(this).hasClass('no-reset')) {
                    var form = $(this).parents('form').get(0),
                        focused = this;
                    if (!$('#edit-multiple') || !$('#edit-multiple').is(':checked'))
                    $('.form-text, .form-select', form).each(function() {
                        if (this != focused && !$(this).hasClass('no-reset'))
                            $(this).val('');
                    });
                }
            });
        });
        
        // Taille de texte
        $('#tools .text-reset').click(function() {
            $('body').css('font-size', 14);
            if ($.cookie)
                $.cookie('fontsize', null, {path: '/'});
            
            $(this).fadeOut();
        });
        $('#tools .text-down').click(function() {
            var size = parseInt($('body').css('font-size'));
            if (size > 8) {
                $('body').css('font-size', size - 1);
                if ($.cookie)
                    $.cookie('fontsize', size - 1, {path: '/'});
                
                if ((size - 1) == 14)
                    $('#tools .text-reset').fadeOut();
                else $('#tools .text-reset').fadeIn();
            }
        });
        $('#tools .text-up').click(function() {
            var size = parseInt($('body').css('font-size'));
            if (size < 24) {
                $('body').css('font-size', size + 1);
                if ($.cookie)
                    $.cookie('fontsize', size + 1, {path: '/'});
                
                if ((size + 1) == 14)
                    $('#tools .text-reset').fadeOut();
                else $('#tools .text-reset').fadeIn();
            }
        });
        

        Drupal.jsAC.prototype.select = function (node) {
  this.input.value = $(node).data('autocompleteValue');
  if(jQuery(this.input).hasClass('auto_submit')){
    this.input.form.submit();
  }};
  

        // Au chargement, on vérifie si une taille de taille est enregistrée dans les cookies
        if ($.cookie) {
            var size = $.cookie('fontsize');
            if (size) {
                $('body').css('font-size', parseInt(size));
                if (size != 14)
                    $('#tools .text-reset').fadeIn();
            }
        }
    }
};

})(jQuery);;
