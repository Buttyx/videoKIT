/**
 * Copyright (c) 2013 Xavier Butty, Switzerland
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function () {

            var NotFoundException,
                VideoKIT,
                VideoStream,
                // CONSTANTS
                DEFAULT_STREAM_INTERVAL = 200; // Default interval for the streams

            NotFoundException = function (message) {
                    this.message = message;
            };
            NotFoundException.prototype = new Error(),
            
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
                start: function () {
                    if (this.paused) {
                        this.paused = false;
                        this.paint();
                    }
                },
                pause: function () {
                    this.paused = true;
                },
                setFilter: function (filter) {
                    this.filter = filter;
                },
                getFilter: function () {
                    return this.filter;
                }
            } 
            
            VideoKIT = function (element) {
                return this.init(element);
            };
            VideoKIT.prototype = {
            
                ratio: 1,
                
                classCanvas: "vm-canvas",
                
                classImg: "vm-img",
                
                init: function (element) {
                    var self = this,
                        // Function to initialize the canvas
                        initCanvas = function () {
                            self.canvas   = self.createCanvas();
                            self.context  = self.canvas.getContext("2d");
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
            
                resizeCanvas: function () {
                    this.canvas.height = this.videoElement.videoHeight * this.ratio;
                    this.canvas.width = this.videoElement.videoWidth * this.ratio;   
                },
                
                createCanvas: function () {
                    var canvas    = document.createElement("canvas");
                    canvas.height = this.videoElement.videoHeight * this.ratio;
                    canvas.width  = this.videoElement.videoWidth * this.ratio;
                    return canvas;
                },
                
                getCanvas: function () {
                    return this.canvas;
                },
                
                duplicateCanvas: function () {
                    var newCanvas = this.createCanvas();
                    
                    
                },
                
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

                getDataUrlFromFrame: function (time, target) {
                    var currentTime, 
                        isPlaying = false,
                        canvas = target || this.canvas;

                    if (time && time >= 0 && time <= this.videoElement.duration) {
                        if (!this.videoElement.paused) {
                            this.videoElement.pause();
                            isPlaying = true;
                        }

                        currentTime = this.videoElement.currentTime;
                        this.videoElement.currentTime = time;

                        this.copyCurrentFrame(target);

                        this.videoElement.currentTime = currentTime;

                        if (isPlaying) {
                            this.videoElement.play();
                        }
                    } else {
                        this.copyCurrentFrame();
                    }
                    
                    return canvas.toDataURL();
                },
                
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

                // TODO add animated gifs
                saveFrame: function (time, target) {
                    window.open(this.getDataUrlFromFrame(time, target).replace("image/png", "image/octet-stream"));
                },
                
                createStream: function (interval, filter, target) {
                    var finalTarget = target || this.createCanvas();
                    
                    finalTarget.height = 200;
                    finalTarget.width = 200;
                    
                    return new VideoStream(finalTarget, this.videoElement, filter, interval);
                }

            };

            window.VideoKIT = VideoKIT;
})();
