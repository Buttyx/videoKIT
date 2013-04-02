/**
 * VideoKIT, simple library to play with the HTML5 video element.
 *
 * Licensed under the MIT licenses.
 *
 * Copyright (c) 2012-2013
 * Xavier Butty, Switzerland
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function () {

            var NotFoundException,
                VideoKIT,
                VideoStream,
                // CONSTANTS
                DEFAULT_STREAM_INTERVAL = 200; // Default interval for the streams

            /**
             * Class representing a video stream
             * @constructor
             * @param {Canvas}      target       The canvas where the stream must be displayed.
             * @param {Video}       source       The video element that is the source of the stream.
             * @param {Function}    filter       The filter function use to render the stream frame.
             * @param {Integer}     interval     Define the frame per second.
             */
            VideoStream = function (target, source, filter, interval) {
                this.filter = filter;
                this.interval = interval || DEFAULT_STREAM_INTERVAL;
                this.target = target;
                this.source = source;
                this.context = target.getContext("2d");

                return this.paint();
            };
            VideoStream.prototype = {

                /**
                 * Define if the streamed is or not paused
                 * @type {Boolean}
                 */
                paused: false,

                /**
                 * Render the current frame
                 */
                paint: function () {
                    var newFrame = this.filter ? this.filter(this.source) : this.source;

                    this.context.drawImage(newFrame, 0, 0, this.target.width, this.target.height);

                    if (!this.paused) {
                        setTimeout(this.paint.bind(this), this.interval);
                    }
                },

                /**
                 * Start the stream
                 */
                start: function () {
                    if (this.paused) {
                        this.paused = false;
                        this.paint();
                    }
                },

                /**
                 * Pause the stream
                 */
                pause: function () {
                    this.paused = true;
                },

                /**
                 * Set the filter to use to render the stream
                 * @param {Filter} filter The new filter to use for the rendering
                 */
                setFilter: function (filter) {
                    this.filter = filter;
                },

                /**
                 * Get the current filter used for the stream rendering
                 * @return {Filter} The current filter
                 */
                getFilter: function () {
                    return this.filter;
                }
            }

            /**
             * @constructor
             * @param {DOM Element} element The video DOM element
             */
            VideoKIT = function (element) {
                return this.init(element);
            };
            VideoKIT.prototype = {

                /**
                 * The zoom level
                 * @type {Number}
                 */
                zoom: 1,

                /**
                 * The classname for the canvas created by videoKIT
                 * @type {String}
                 */
                classCanvas: "vm-canvas",

                /**
                 * The classname for the images created by videoKIT
                 * @type {String}
                 */
                classImg: "vm-img",

                /**
                 * Initialize videoKit
                 * @param  {DOM Element} element The video DOM element
                 * @return {VideoKit}            The initialized videoKIT
                 */
                init: function (element) {
                    var self = this,
                        // Function to initialize the canvas
                        initCanvas = function () {
                            self.canvas   = self.createCanvas();
                            self.context  = self.canvas.getContext("2d");
                            // Ratio between width / height
                            self.ratio    = this.videoElement.videoWidth / this.videoElement.videoHeight;
                        };

                    if (typeof element !== "object" || element.tagName.toUpperCase() !== "VIDEO") {
                        throw new TypeError("Parameter must be a valid video element!");
                    }

                    this.videoElement = element;

                    if (this.videoElement.readyState > 0) {
                        initCanvas();
                    } else {
                        this.videoElement.addEventListener("canplay", initCanvas);
                    }
                    return this;
                },


                /**
                 * Create a new canvas with the same size as the video element
                 * @return {Canvas} The new canvas
                 */
                createCanvas: function () {
                    var canvas    = document.createElement("canvas");
                    canvas.height = this.videoElement.videoHeight * this.zoom;
                    canvas.width  = this.videoElement.videoWidth * this.zoom;
                    return canvas;
                },

                /**
                 * Get the current canvas used for the rendering
                 * @return {Canvas} The current canvas
                 */
                getCanvas: function () {
                    return this.canvas;
                },

                /**
                 * Copy the current videoframe to the canvas with the given canvas
                 * @param  {Filter} [filter] The filter to use to render the frame
                 */
                copyCurrentFrame: function (filter) {
                    var isPlaying = false;

                    // Check if the video is playing
                    if (!this.videoElement.paused) {
                        this.videoElement.pause();
                        isPlaying = true;
                    }

                    this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);

                    if (isPlaying) {
                         this.videoElement.play();
                    }
                },

                /**
                 * Get a Data URL from the frame at the given time (or at the current time if given)
                 * @param  {Integer} [time]     The timecode of the frame to copy
                 * @param  {Filter} [filter]    The filter to use to render the frame
                 * @return {DataUrl}            The frame as Data URL
                 */
                getDataUrlFromFrame: function (time, filter) {
                    var currentTime,
                        isPlaying = false;

                    if (time && time >= 0 && time <= this.videoElement.duration) {
                        if (!this.videoElement.paused) {
                            this.videoElement.pause();
                            isPlaying = true;
                        }

                        currentTime = this.videoElement.currentTime;
                        this.videoElement.currentTime = time;

                        this.copyCurrentFrame(filter);

                        this.videoElement.currentTime = currentTime;

                        if (isPlaying) {
                            this.videoElement.play();
                        }
                    } else {
                        this.copyCurrentFrame();
                    }
                    return this.canvas.toDataURL();
                },

                /**
                 * Copy the current frame to an image
                 * @param  {Object} params Literal object with the parameters for the copy.
                 * @return {DOM Element}        An image or link element warpping an image element.
                 */
                copyFrameToImg: function (params) {
                    var options = (params || {}),
                        imgElement = (options.imgElement || document.createElement("img")),
                        linkElement;

                    imgElement.src = this.getDataUrlFromFrame(options.time, options.target);

                    if (options.withLink) {
                        linkElement = document.createElement("a");
                        linkElement.href = imgElement.src;
                        linkElement.appendChild(imgElement);
                        linkElement.target = "_blank";
                        return linkElement;
                    }

                    return imgElement;
                },

                /**
                 * Save the videoframe at the given time (or at the current time if given)
                 * @param  {Integer} [time]     The timecode of the frame to copy
                 * @param  {Filter} [filter]    The filter to use to render the frame
                 */
                saveFrame: function (time, filter) {
                    window.open(this.getDataUrlFromFrame(time, filter).replace("image/png", "image/octet-stream"));
                },

                /**
                 * Create a stream from the video source to the target canvas or a new canvas
                 * @param  {Interval} interval [description]
                 * @param  {Filter} filter   [description]
                 * @param  {DOM Element} target   [description]
                 * @param  {Integer} size     [description]
                 * @return {VideoStream}          The new video stream
                 */
                createStream: function (interval, filter, target, size) {
                    var finalTarget = target || this.createCanvas();

                    finalTarget.height = 200 ;
                    finalTarget.width = finalTarget.height * this.ratio;

                    return new VideoStream(finalTarget, this.videoElement, filter, interval);
                }

            };

            window.VideoKIT = VideoKIT;
})();
