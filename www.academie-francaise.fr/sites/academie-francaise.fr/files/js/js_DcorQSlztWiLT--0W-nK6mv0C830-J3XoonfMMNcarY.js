/*
    SDV Plurimédia
    =========================
    développé par Nicolas Ricklin
    pour SDV Plurimédia (http://sdv.fr)
*/

(function ($) {

Drupal.behaviors.sdv  = {
    attach: function (context, settings) {
        // Gestion des champs WYSIWYG au click
        if (!settings || !settings.wysiwyg || !settings.wysiwyg.triggers || !settings.wysiwyg.configs || !settings.wysiwyg.configs.ckeditor)
            return;
        
        $.each(settings.wysiwyg.triggers, function(index, element) {
            var field = $('#' + element.field).get(0);
            if (!field || field.wysiwygProcessed)
                return;
            
            field.wysiwygProcessed = true;
            field.container = $(field).parents('.text-format-wrapper').first(),
            field.formatSelect = $('.filter-wrapper .filter-list', field.container);
            
            $(field).focus(function() {
                var format = this.formatSelect.val();
                if (format && settings.wysiwyg.configs.ckeditor['format' + format] && settings.wysiwyg.configs.ckeditor['format' + format].onclick) {
                    if (window.currentWysiwyg && window.currentWysiwyg.status)
                        Drupal.wysiwyg.toggleWysiwyg({data: {
                            context: context,
                            params: window.currentWysiwyg
                        }});
                    
                    window.currentWysiwyg = settings.wysiwyg.triggers[this.formatSelect.attr('id')]['format' + format];
                    Drupal.wysiwyg.toggleWysiwyg({data: {
                        context: context,
                        params: window.currentWysiwyg
                    }});
                }
            });
            
            
        
            /*field.wysiwygProcessed = true;
            field.toggler = $('#wysiwyg-toggle-' + field.id);
            $(field).focus(function() {
                if (window.currentartdevivreEdit)
                    window.currentartdevivreEdit.trigger('click');
                var container = $(this).parents('.artdevivre-columns-fieldset, .sdv-columns-fieldset').first();
                if (container.length == 0)
                    container = $(this).parents('.text-format-wrapper').first();
                window.currentartdevivreEdit = $('.wysiwyg-toggle-wrapper a', container);
                window.currentartdevivreEdit.trigger('click');
            });*/
        });
        
        // On retire l'alerte mais on copie la fonction depuis /misc/ajax.js
        if (Drupal.ajax)
        Drupal.ajax.prototype.error = function (response, uri) {
            console.log(Drupal.ajaxError(response, uri));
            
            // Remove the progress element.
            if (this.progress.element) {
                $(this.progress.element).remove();
            }
            if (this.progress.object) {
                this.progress.object.stopMonitoring();
            }
            // Undo hide.
            $(this.wrapper).show();
            // Re-enable the element.
            $(this.element).removeClass('progress-disabled').removeAttr('disabled');
            // Reattach behaviors, if they were detached in beforeSerialize().
            if (this.form) {
                var settings = response.settings || this.settings || Drupal.settings;
                Drupal.attachBehaviors(this.form, settings);
            }
        };
    }
};

})(jQuery);;
