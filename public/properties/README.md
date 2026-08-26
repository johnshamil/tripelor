# Tripelor property media structure

Every property gets its own folder. Keep general property photos separate from room-specific photos.

Example:

```
public/properties/
  property-slug/
    property/
      cover.jpg
      exterior.jpg
      reception.jpg
      restaurant.jpg
    rooms/
      room-101/
        01.jpg
        02.jpg
      room-102/
        01.jpg
        02.jpg
```

For hotels that use room categories rather than room numbers, use category slugs instead:

```
rooms/
  deluxe-double/
  deluxe-twin/
  deluxe-sea-view/
```

When adding a new Tripelor property, create the property folder first, then `property/` for shared hotel/guesthouse photos and one folder under `rooms/` for each separately displayed/bookable room or room category.
