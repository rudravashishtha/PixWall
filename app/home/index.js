import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import Categories from "../../components/categories";
import { apiCall } from "../../api";
import ImageGrid from "../../components/imageGrid";
import { debounce, filter } from "lodash";
import FiltersModal from "../../components/filtersModal";
import { ActivityIndicator } from "react-native";

var page = 1;

const HomeScreen = () => {
  const { top } = useSafeAreaInsets();
  const paddingTop = top > 0 ? top + 10 : 30;
  const [search, setSearch] = useState("");
  const [images, setImages] = useState([]);
  const [filters, setFilters] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isEndReached, setIsEndReached] = useState(false);

  const searchInput = useRef(null);
  const modalRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async (params = { page: 1 }, append = true) => {
    let res = await apiCall(params);

    if (res.success && res?.data?.hits) {
      if (append) setImages([...images, ...res.data.hits]);
      else setImages(res.data.hits);
    }
  };

  const openFiltersModal = () => {
    modalRef?.current?.present(); // Open the modal
  };

  const closeFiltersModal = () => {
    modalRef?.current?.close(); // Close the modal
  };

  const applyFilters = () => {
    if (filters) {
      page = 1;
      setImages([]);
      let params = { page, ...filters };
      if (activeCategory) params.category = activeCategory;
      if (search) params.q = search;
      fetchImages(params, false);
    }
    // // delay 200ms
    setTimeout(() => {
      closeFiltersModal();
    }, 200);
  };
  const resetFilters = () => {
    // Reload the images
    if (filters) {
      page = 1;
      setFilters(null);
      setImages([]);
      let params = { page };
      if (activeCategory) params.category = activeCategory;
      if (search) params.q = search;
      fetchImages(params, false);
    }
    // delay 200ms
    setTimeout(() => {
      closeFiltersModal();
    }, 200);
  };

  const clearThisFilter = (filterName) => {
    let newFilters = { ...filters };
    delete newFilters[filterName];
    setFilters(newFilters);
    page = 1;
    setImages([]);
    let params = { page, ...newFilters };
    if (activeCategory) params.category = activeCategory;
    if (search) params.q = search;
    fetchImages(params, false);
  };

  const handleChangeCategory = (cat) => {
    setActiveCategory(cat);
    clearSearch();
    setImages([]);
    page = 1;
    let params = {
      page,
      ...filters,
    };
    if (cat) params.category = cat;
    fetchImages(params, false);
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 2) {
      // Search for the text
      page = 1;
      setImages([]);
      setActiveCategory(null);
      fetchImages({ page, q: text, ...filters }, false);
    }

    if (text == "") {
      // Reset the results
      page = 1;
      searchInput?.current?.clear();
      setImages([]);
      setActiveCategory(null); // clear category while searching
      fetchImages({ page, ...filters }, false);
    }
  };

  const clearSearch = () => {
    setSearch("");
    searchInput?.current?.clear();
  };

  const handleScroll = (event) => {
    let contentHeight = event.nativeEvent.contentSize.height;

    let layoutHeight = event.nativeEvent.layoutMeasurement.height;
    let scrollOffset = event.nativeEvent.contentOffset.y;
    const bottomPosition = contentHeight - layoutHeight;

    if (scrollOffset >= bottomPosition - 1) {
      if (!isEndReached) {
        // Load more images
        setIsEndReached(true);
        ++page;
        let params = { page, ...filters };
        if (activeCategory) params.category = activeCategory;
        if (search) params.q = search;
        fetchImages(params); // Append the images to the existing ones
      }
    } else if (isEndReached) {
      setIsEndReached(false);
    }
  };

  const handleScrollUp = () => {
    scrollRef?.current?.scrollTo({ y: 0, animated: true }); // Scroll to top
  };

  const handleTextDebounce = useCallback(debounce(handleSearch, 400), []);

  return (
    <View style={[styles.container, { paddingTop }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleScrollUp}>
          <Text style={styles.title}>Pix Wall</Text>
        </Pressable>
        <Pressable onPress={openFiltersModal}>
          <FontAwesome6
            name="bars-staggered"
            size={24}
            color={theme.colors.neutral(0.7)}
          />
        </Pressable>
      </View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={5} // how often we update the scroll event (in ms)
        ref={scrollRef}
        contentContainerStyle={{ gap: 15 }}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <View style={styles.searchIcon}>
            <Feather
              name="search"
              size={24}
              color={theme.colors.neutral(0.4)}
            />
          </View>
          <TextInput
            placeholder="Search for Photos"
            // value={search}
            ref={searchInput}
            onChangeText={handleTextDebounce}
            style={styles.searchInput}
          />
          {search && (
            <Pressable
              onPress={() => handleSearch("")}
              style={styles.closeIcon}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.neutral(0.6)}
              />
            </Pressable>
          )}
        </View>

        {/* Categories */}
        <View style={styles.categories}>
          <Categories
            activeCategory={activeCategory}
            handleChangeCategory={handleChangeCategory}
          />
        </View>

        {/* Filters on Home */}
        {filters && (
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {Object.keys(filters).map((key, index) => {
                return (
                  <View key={key} style={styles.filterItem}>
                    {key == "colors" ? (
                      <View
                        style={{
                          width: 30,
                          height: 20,
                          borderRadius: 7,
                          backgroundColor: filters[key],
                        }}
                      />
                    ) : (
                      <Text style={styles.filterItemText}>{filters[key]}</Text>
                    )}
                    <Pressable
                      onPress={() => clearThisFilter(key)}
                      style={styles.filterCloseIcon}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={theme.colors.neutral(0.9)}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Images Masonry Grid */}
        <View>{images.length > 0 && <ImageGrid images={images} />}</View>

        {/* Loading */}
        <View
          style={{
            marginBottom: 70,
            marginTop: images.length > 0 ? 10 : 70,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.neutral(0.6)} />
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <FiltersModal
        modalRef={modalRef}
        onClose={closeFiltersModal}
        onApply={applyFilters}
        onReset={resetFilters}
        filters={filters}
        setFilters={setFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 15,
  },
  header: {
    marginHorizontal: wp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.neutral(0.9),
  },
  searchBar: {
    marginHorizontal: wp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.grayBG,
    backgroundColor: theme.colors.white,
    padding: 6,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: theme.radius.lg,
  },
  searchIcon: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    borderRadius: theme.radius.sm,
    paddingVertical: 10,
    fontSize: hp(1.8),
    paddingLeft: 10,
  },
  closeIcon: {
    backgroundColor: theme.colors.neutral(0.1),
    padding: 8,
    borderRadius: theme.radius.sm,
  },
  filters: {
    paddingHorizontal: wp(4),
    gap: 10,
  },
  filterItem: {
    backgroundColor: theme.colors.grayBG,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.xs,
    gap: 10,
    paddingHorizontal: 10,
  },
  filterItemText: {
    fontSize: hp(1.8),
  },
  filterCloseIcon: {
    backgroundColor: theme.colors.neutral(0.1),
    padding: 4,
    borderRadius: 7,
  },
});

export default HomeScreen;
