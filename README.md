# Formstack Maps

Places Review application created with Laravel for integrate Formstack and Google Maps.

There is no database at this application. All the data is sync with Formstack.

A running demo of this application can be accessed at: formstack.edgar.systems:8888

## Screenshots

![Screenshot 01 of Formstack Maps]
(http://edgar.systems/formstack/screenshot-01.png)

![Screenshot 02 of Formstack Maps]
(http://edgar.systems/formstack/screenshot-02.png)

![Screenshot 03 of Formstack Maps]
(http://edgar.systems/formstack/screenshot-03.png)

## How to run

- Clone the repository and configure the Laravel 5.1 to its directory.
- Set the configs at the files **/formstack-maps/config/formstack.php** and **/formstack-maps/config/app.php**
- Configure your webserver to the folder **/formstack-maps/public**

### Requirements

- Running webserver (Apache or NGINX)
- PHP (5.5.9+)
- Laravel 5.1

### Vagrant

To use Vagrant to create a local environment, follow the instructions below:

- Install Virtualbox (5.x)
- Install Vagrant (1.7.4+)
- Follow **all** the instructions for download and configure [Laravel Homestead](http://laravel.com/docs/5.1/homestead)
- Clone this repository
- Set your custom configs
- Go to formstack-maps folder:
```sh
$ cd formstack-maps
```
- Ensure that you have permission to write the **storage** folder:
```sh
$ sudo chown -R myuser:www-data storage/
$ chmod -R 755 storage/
```
- Run the vagrant:
```sh
$ vagrant up
```
- To stops the vagrant machine, run the destroy command:
```sh
$ vagrant destroy --force
```

## Third-party components

- [Formstack REST API](http://developers.formstack.com/)
- [Google Maps Javascript API](https://developers.google.com/maps/documentation/javascript/?hl=pt-BR)
- [Laravel](http://laravel.com/)
- [GuzzleHTTP](https://github.com/guzzle/guzzle)
- [Intervention Image](http://image.intervention.io/)
- [jQuery](http://jquery.com/)
- Logo icon created by Creative Stall from the Noun Project.
