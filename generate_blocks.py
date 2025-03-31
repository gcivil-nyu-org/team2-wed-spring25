from shapely.geometry import LineString, Point
import geopandas as gpd
import pandas as pd

def split_road_at_intersections(road, other_roads):
    subsegments = [road]  # Start with the whole road as one segment
    
    for other_road in other_roads:
        if road.intersects(other_road):
            intersection = road.intersection(other_road)
            
            if isinstance(intersection, Point):  # If the intersection is a point
                # Split the road at the intersection point
                subsegments = []
                start = road.interpolate(road.project(Point(road.coords[0])))  # Starting point
                end = road.interpolate(road.project(Point(road.coords[-1])))  # Ending point
                
                first_segment = LineString([start, intersection])
                second_segment = LineString([intersection, end])
                
                subsegments.append(first_segment)
                subsegments.append(second_segment)
    
    return subsegments

def main():
    ny_roads_1 = gpd.read_file('/Users/naliniramanathan/projects/se_1/team2-wed-spring25/input_data/tl_2024_36005_roads/tl_2024_36005_roads.shp')
    ny_roads_2 = gpd.read_file('/Users/naliniramanathan/projects/se_1/team2-wed-spring25/input_data/tl_2024_36047_roads/tl_2024_36047_roads.shp')
    ny_roads_3 = gpd.read_file('/Users/naliniramanathan/projects/se_1/team2-wed-spring25/input_data/tl_2024_36061_roads/tl_2024_36061_roads.shp')
    ny_roads_4 = gpd.read_file('/Users/naliniramanathan/projects/se_1/team2-wed-spring25/input_data/tl_2024_36081_roads/tl_2024_36081_roads.shp')
    ny_roads_5 = gpd.read_file('/Users/naliniramanathan/projects/se_1/team2-wed-spring25/input_data/tl_2024_36085_roads/tl_2024_36085_roads.shp')
    ny_roads_final = gpd.GeoDataFrame(pd.concat([ny_roads_1, ny_roads_2, ny_roads_3, ny_roads_4, ny_roads_5], ignore_index=True))
    split_roads = []
    for road in ny_roads_final['geometry']:
        other_roads = ny_roads_final['geometry'].loc[ny_roads_final['geometry'] != road]
        subsegments = split_road_at_intersections(road, other_roads)
        split_roads.extend(subsegments)

    # Convert the result to a GeoDataFrame
    subsegments_gdf = gpd.GeoDataFrame(geometry=split_roads)
    subsegments_gdf.to_file('output_data/nyc_blocks.shp')
    