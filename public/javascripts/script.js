$('document').ready(function(){
    $.material.init();

    //浮动按钮
    for(var i = 0;i<$('.btn-fab-main').length;i++){
        var mainFabBtn = $('.btn-fab-main')[i];
        $(mainFabBtn).click(function(){ 
            if($(mainFabBtn).parent().hasClass('active'))
                $(mainFabBtn).parent().removeClass('active');
            else
                $(mainFabBtn).parent().addClass('active');
        });
    }

    $('form').submit(function (e) {
        var form = $(this);
        var modal = $($(this).parentsUntil('.modal').parent()[0]);
        $.snackbar({content: 'Loading...'});

        $.ajax({
            type: 'POST',
            url: form.attr('action'),
            data: form.serialize(),
            dataType: 'json',
            success: function(data){
                if(data.stat){
                    $.snackbar({content: data.msg});
                    return;
                } else {
                    location.reload();
                }
            }
        });
        return false;
    });
});
