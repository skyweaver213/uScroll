/**
 * Created by huangjianhua on 14-11-1.
 */

$(function() {

    var startY, moveY, moveEndY,firstPos,lastPos,firstTouch_obj,cur_top,
        startTimeStamp, endTimeStamp;

    var $scroll_section = $('.scroll-section');
    var $scroll_title = $('.section-title');
    var init_top = $scroll_section.position().top;  //初始的top
    var loading_title_height = $('.section-title').height();
    var $wrap_rel = $('.wrap-rel');
    var $wrap_rel_h = $wrap_rel.height();
    var $scroll_section_h = $scroll_section.height();
    var $section_title_h = $scroll_title.height();   //nav的高度，就是拖动刷新的幅度 scrollRefresh

    var scroll_h = $scroll_section_h - $wrap_rel_h  + 50;  //滚动条的总长度
    var bottom_top = -(scroll_h); //最底部的位置

    //滚动轮的高度 = 滚动条的高度 / 滚动页面的总高度 * 滚动条的高度
    var scroll_wrap_h =  $('.j_scroll_wrap').height();
    var j_scroll_h = scroll_wrap_h /scroll_h * scroll_wrap_h;
    $('.j_scroll').css('height', j_scroll_h);

    var scroll_total_top = scroll_wrap_h - j_scroll_h;  //滚动轮最多的top数

    $('.wrap-rel').on('touchstart', function(e) {
        startTimeStamp = e.timeStamp || Date.now();
        //初始触摸的点
        firstTouch_obj = e.touches[0];
        moveY = 0;
        firstPos = {y:firstTouch_obj.clientY};   //第一个开始scroll的坐标
        cur_top = $scroll_section.position().top;  //当前的scroll区域的top

        //开始拖动时清除动画缓冲效果
        $scroll_section.removeClass('scroll-transition');
        $scroll_section.removeClass('scroll-transition2');
        $('.j_scroll').removeClass('scroll-transition3');



//        console.log('start clientY: ', firstTouch_obj.clientY, 'pageY:', firstTouch_obj.pageY);
    }).on('touchmove', function(e) {
            var lastTouch_obj = e.touches[0];
            lastPos = {y:lastTouch_obj.clientY};   //第一个开始scroll的坐标

            //判断是向上滑动还是向下滑动
            moveY = lastPos.y - firstPos.y;

            $scroll_section.css('top', (cur_top+moveY)+'px');

            //计算滚动条的top
            momentScroll(cur_top+moveY);




        }).on('touchend', function(e) {
//            firstPos = null;  //重置第一个开始模拟滚动标记的坐标点
            endTimeStamp = e.timeStamp || Date.now();

            var touch_obj = e.changedTouches[0];

            console.log(e.timeStamp, 'xm');
            //在释放的时候，根据拖动的距离和时间，模拟自动滚动的效果
            var maxDistUpper = init_top - (cur_top+moveY),
                maxDistLower = (cur_top+moveY) - bottom_top;
            var momentStep = _momentum(moveY, endTimeStamp - startTimeStamp, maxDistUpper, maxDistLower, $wrap_rel_h);

            //滚动的动画
            console.log('animation:', momentStep, (cur_top+moveY));
            releaseAutoScroll(momentStep, (cur_top+moveY));

            //拖动的区里大于设定刷新的距离则刷新，且为正数,
            if((cur_top+moveY) > -$section_title_h && (cur_top+moveY) < 0) {
                $scroll_section.addClass('scroll-transition');
                $scroll_section.css('top', init_top+'px');
                //如果css动画结束 ，还原
                return;
            }

            //refresh
            else if((cur_top+moveY) > init_top) {
                $scroll_section.addClass('scroll-transition2'); // 设置缓冲的class

                //还原到loading状态
                $scroll_section.css('top', (init_top+loading_title_height)+'px');
                $scroll_title.html('正在为你获取最新信息');

                //还有滚动条
                $('.j_scroll').addClass('scroll-transition3');
                $('.j_scroll').css('height',j_scroll_h);

                //刷新后的回调，还原到初始状态
                setTimeout(function(){
                    $scroll_section.css('top', init_top+'px');

                    $scroll_title.html('下拉获取最新信息');


                },1500);
            }

            //如果移动到底部，则不再往下滚动了
            else if((bottom_top) > (cur_top+moveY)) {
                $('.j_scroll').addClass('scroll-transition3');
                $scroll_section.addClass('scroll-transition2'); // 设置缓冲的class

                $scroll_section.css('top', bottom_top+'px');

                $('.j_scroll').css('height',j_scroll_h);
            }


        });


    //计算滚动条的位置
    function momentScroll(currentTop) {
        var scroll_cur_top = scroll_total_top * (init_top-currentTop)/(init_top- bottom_top);
        //top0  还向上拉
        if((currentTop) > init_top) {
            $('.j_scroll').css({'top': 0, 'height':j_scroll_h+scroll_cur_top+'px'});
        }
        //最低还向上拉
        else if((currentTop)<bottom_top) {

            $('.j_scroll').css({'top':'auto','bottom': 0, 'height':j_scroll_h-(scroll_cur_top-scroll_total_top) +'px'});
        }
        //正常范围内拖动
        else {
            $('.j_scroll').css('top', scroll_cur_top);
        }
    }

    //根据拖动的距离  和时间  模拟滚动的距离和时间
    function _momentum(dist, time, maxDistUpper, maxDistLower, size) {
        console.log('dist', dist, 'time', time, 'maxDistUpper', maxDistUpper, 'maxDistLower', maxDistLower, 'size', size);

        var m = Math,
            deceleration = 0.0006,
            speed = m.abs(dist) / time,
            newDist = (speed * speed) / (2 * deceleration),
            newTime = 0, outsideDist = 0;

        // Proportinally reduce speed if we are outside of the boundaries
        if (dist > 0 && newDist > maxDistUpper) {
            outsideDist = size / (6 / (newDist / speed * deceleration));
            maxDistUpper = maxDistUpper + outsideDist;
            speed = speed * maxDistUpper / newDist;
            newDist = maxDistUpper;
        } else if (dist < 0 && newDist > maxDistLower) {
            outsideDist = size / (6 / (newDist / speed * deceleration));
            maxDistLower = maxDistLower + outsideDist;
            speed = speed * maxDistLower / newDist;
            newDist = maxDistLower;
        }

        newDist = newDist * (dist < 0 ? -1 : 1);
        newTime = speed / deceleration;

        console.log('return dist', newDist, 'time', m.round(newTime));

        return { dist: newDist, time: m.round(newTime) };
    }

    //自动滚动的效果
    function releaseAutoScroll(momentStep, startY) {
        var startTime = Date.now(),animate,easeOut, step={},
            m = Math;

            step.time = momentStep.time,
            step.y = momentStep.dist + startY;


        animate = function() {
            var now = Date.now(), newY;

            if(now >=  startTime + step.time){
                //判断上下的界限
                if(step.y > -60) {
                    $scroll_section.css({'top':(-60)+'px'});
                    $scroll_section.addClass('scroll-transition2');
                } else if(step.y < bottom_top) {
                    $scroll_section.css({'top': (bottom_top)+'px'});
                    $scroll_section.addClass('scroll-transition2');
                }
                return;
            }

            now = (now - startTime) / step.time - 1;
            easeOut = m.sqrt(1 - now * now);
            newY = (step.y - startY) * easeOut + startY;

            momentScroll(m.round(newY));//重新定位滚动条

            $scroll_section.css('top', (m.round(newY))+'px');

            webkitRequestAnimationFrame(animate);
        }

        animate();

    }


});
